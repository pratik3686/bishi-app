const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

let currentBishi = null;
let wheel = null;
let pendingWinner = null;
let pinModalMode = 'spin'; // 'spin' | 'change' | 'set'

// DOM refs — set on init
let screens = {};
let elements = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  bindEvents();
  wheel = new BishiWheel(elements.wheelCanvas);
  await loadBishi();
}

function cacheElements() {
  screens = {
    setup: document.getElementById('screen-setup'),
    members: document.getElementById('screen-members'),
    dashboard: document.getElementById('screen-dashboard')
  };

  elements = {
    // Setup form
    setupForm: document.getElementById('setup-form'),
    bishiName: document.getElementById('bishi-name'),
    monthlyAmount: document.getElementById('monthly-amount'),
    startMonth: document.getElementById('start-month'),
    memberCount: document.getElementById('member-count'),
    spinPin: document.getElementById('spin-pin'),
    spinPinConfirm: document.getElementById('spin-pin-confirm'),

    // Members
    memberInput: document.getElementById('member-input'),
    addMemberBtn: document.getElementById('add-member-btn'),
    memberList: document.getElementById('member-list'),
    membersNeeded: document.getElementById('members-needed'),
    goToDashboardBtn: document.getElementById('go-dashboard-btn'),

    // Dashboard
    dashName: document.getElementById('dash-name'),
    dashAmount: document.getElementById('dash-amount'),
    dashTotalMembers: document.getElementById('dash-total-members'),
    dashCurrentMonth: document.getElementById('dash-current-month'),
    dashEligible: document.getElementById('dash-eligible'),
    dashReceived: document.getElementById('dash-received'),
    dashPayouts: document.getElementById('dash-payouts'),

    wheelCanvas: document.getElementById('wheel-canvas'),
    runBishiBtn: document.getElementById('run-bishi-btn'),
    pinStatus: document.getElementById('pin-status'),
    changePinBtn: document.getElementById('change-pin-btn'),
    winnerPanel: document.getElementById('winner-panel'),
    winnerMessage: document.getElementById('winner-message'),
    winnerPool: document.getElementById('winner-pool'),
    confirmWinnerBtn: document.getElementById('confirm-winner-btn'),
    cancelWinnerBtn: document.getElementById('cancel-winner-btn'),

    eligibleList: document.getElementById('eligible-list'),
    receivedList: document.getElementById('received-list'),
    historyBody: document.getElementById('history-body'),
    addPreviousBtn: document.getElementById('add-previous-btn'),
    previousResultPanel: document.getElementById('previous-result-panel'),
    previousMonth: document.getElementById('previous-month'),
    previousWinner: document.getElementById('previous-winner'),
    previousAmount: document.getElementById('previous-amount'),
    previousResultError: document.getElementById('previous-result-error'),
    savePreviousBtn: document.getElementById('save-previous-btn'),
    cancelPreviousBtn: document.getElementById('cancel-previous-btn'),
    resetBtn: document.getElementById('reset-btn'),

    pinModal: document.getElementById('pin-modal'),
    pinModalBackdrop: document.getElementById('pin-modal-backdrop'),
    pinModalTitle: document.getElementById('pin-modal-title'),
    pinModalSubtitle: document.getElementById('pin-modal-subtitle'),
    pinInput: document.getElementById('pin-input'),
    pinError: document.getElementById('pin-error'),
    pinSubmitBtn: document.getElementById('pin-submit-btn'),
    pinCancelBtn: document.getElementById('pin-cancel-btn')
  };

  // Default start month to current month
  const now = new Date();
  elements.startMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function bindEvents() {
  elements.setupForm.addEventListener('submit', handleCreateBishi);
  elements.addMemberBtn.addEventListener('click', handleAddMember);
  elements.memberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  });
  elements.goToDashboardBtn.addEventListener('click', () => {
    showScreen('dashboard');
    renderDashboard();
  });
  elements.runBishiBtn.addEventListener('click', handleRunBishiClick);
  elements.changePinBtn.addEventListener('click', () => openPinModal('change'));
  elements.pinSubmitBtn.addEventListener('click', handlePinSubmit);
  elements.pinCancelBtn.addEventListener('click', closePinModal);
  elements.pinModalBackdrop.addEventListener('click', closePinModal);
  elements.pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlePinSubmit();
  });
  elements.confirmWinnerBtn.addEventListener('click', handleConfirmWinner);
  elements.cancelWinnerBtn.addEventListener('click', handleCancelWinner);
  elements.addPreviousBtn.addEventListener('click', openPreviousResultPanel);
  elements.savePreviousBtn.addEventListener('click', handleSavePreviousResult);
  elements.cancelPreviousBtn.addEventListener('click', closePreviousResultPanel);
  elements.resetBtn.addEventListener('click', handleReset);
}

async function loadBishi() {
  currentBishi = await getActiveBishi();
  if (!currentBishi) {
    showScreen('setup');
    return;
  }

  if (currentBishi.members.length < currentBishi.numberOfMembers) {
    showScreen('members');
    renderMembersScreen();
  } else {
    showScreen('dashboard');
    renderDashboard();
  }
}

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
}

// --- Create Bishi ---

async function handleCreateBishi(e) {
  e.preventDefault();

  const name = elements.bishiName.value.trim();
  const amount = parseFloat(elements.monthlyAmount.value);
  const startMonth = elements.startMonth.value;
  const numberOfMembers = parseInt(elements.memberCount.value, 10);
  const pin = elements.spinPin.value.trim();
  const pinConfirm = elements.spinPinConfirm.value.trim();

  if (!name || !amount || !startMonth || !numberOfMembers || numberOfMembers < 2) {
    alert('Please fill all fields. You need at least 2 members.');
    return;
  }

  if (!isValidPin(pin)) {
    alert('Spin PIN must be 4–6 digits.');
    return;
  }

  if (pin !== pinConfirm) {
    alert('Spin PIN and confirmation do not match.');
    return;
  }

  const spinPinHash = await hashPin(pin);

  currentBishi = {
    id: generateId(),
    name,
    monthlyAmount: amount,
    startMonth,
    numberOfMembers,
    spinPinHash,
    members: [],
    history: [],
    createdAt: Date.now()
  };

  await saveBishi(currentBishi);
  showScreen('members');
  renderMembersScreen();
}

// --- Members ---

function handleAddMember() {
  const name = elements.memberInput.value.trim();
  if (!name) return;

  if (currentBishi.members.length >= currentBishi.numberOfMembers) {
    alert('All member slots are filled.');
    return;
  }

  if (currentBishi.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
    alert('This member already exists.');
    return;
  }

  currentBishi.members.push({
    id: generateMemberId(),
    name,
    received: false
  });

  elements.memberInput.value = '';
  saveBishi(currentBishi);
  renderMembersScreen();
}

function handleRemoveMember(memberId) {
  currentBishi.members = currentBishi.members.filter((m) => m.id !== memberId);
  saveBishi(currentBishi);
  renderMembersScreen();
}

function renderMembersScreen() {
  const needed = currentBishi.numberOfMembers - currentBishi.members.length;
  elements.membersNeeded.textContent =
    needed > 0
      ? `Add ${needed} more member${needed > 1 ? 's' : ''}`
      : 'All members added!';

  elements.memberList.innerHTML = currentBishi.members
    .map(
      (m) => `
      <li class="member-item">
        <span>${escapeHtml(m.name)}</span>
        <button type="button" class="btn-small btn-danger" data-id="${m.id}">Remove</button>
      </li>`
    )
    .join('');

  elements.memberList.querySelectorAll('.btn-danger').forEach((btn) => {
    btn.addEventListener('click', () => handleRemoveMember(btn.dataset.id));
  });

  elements.addMemberBtn.disabled = needed <= 0;
  elements.memberInput.disabled = needed <= 0;
  elements.goToDashboardBtn.disabled = currentBishi.members.length < currentBishi.numberOfMembers;
}

// --- Dashboard ---

function getEligibleMembers() {
  return currentBishi.members.filter((m) => !m.received);
}

function getReceivedMembers() {
  return currentBishi.members.filter((m) => m.received);
}

function monthInputToLabel(monthValue) {
  const [year, month] = String(monthValue).split('-').map(Number);
  if (!year || !month) return '';
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function labelToMonthKey(label) {
  const match = String(label || '').match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/);
  if (!match) return null;
  const monthIndex = MONTH_NAMES.indexOf(match[1]);
  if (monthIndex < 0) return null;
  return Number(match[2]) * 12 + monthIndex;
}

function getHistorySorted() {
  return [...(currentBishi.history || [])].sort((a, b) => {
    const aKey = labelToMonthKey(a.month);
    const bKey = labelToMonthKey(b.month);
    if (aKey === null && bKey === null) return (a.confirmedAt || 0) - (b.confirmedAt || 0);
    if (aKey === null) return 1;
    if (bKey === null) return -1;
    return aKey - bKey;
  });
}

function getCurrentMonthLabel() {
  const history = getHistorySorted();
  if (history.length > 0) {
    const latestKey = labelToMonthKey(history[history.length - 1].month);
    if (latestKey !== null) {
      const year = Math.floor(latestKey / 12);
      const monthIndex = latestKey % 12;
      const date = new Date(year, monthIndex + 1, 1);
      return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    }
  }
  return monthInputToLabel(currentBishi.startMonth);
}

function getMonthLabelForHistory(index) {
  const history = getHistorySorted();
  return history[index]?.month || '';
}

function formatCurrency(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

function renderDashboard() {
  const eligible = getEligibleMembers();
  const received = getReceivedMembers();
  const pool = currentBishi.monthlyAmount * currentBishi.numberOfMembers;

  elements.dashName.textContent = currentBishi.name;
  elements.dashAmount.textContent = `${formatCurrency(currentBishi.monthlyAmount)} / month`;
  elements.dashTotalMembers.textContent = currentBishi.numberOfMembers;
  elements.dashCurrentMonth.textContent = getCurrentMonthLabel();
  elements.dashEligible.textContent = eligible.length;
  elements.dashReceived.textContent = received.length;
  elements.dashPayouts.textContent = currentBishi.history.length;

  wheel.setMembers(eligible);

  const canSpin = eligible.length > 0;
  elements.runBishiBtn.disabled = !canSpin;
  elements.runBishiBtn.textContent = canSpin ? '🔒 RUN BISHI' : '✅ Cycle Complete';

  if (currentBishi.spinPinHash) {
    elements.pinStatus.classList.remove('hidden');
    elements.changePinBtn.classList.remove('hidden');
  } else {
    elements.pinStatus.classList.add('hidden');
    elements.changePinBtn.textContent = 'Set Spin PIN';
    elements.changePinBtn.classList.remove('hidden');
  }

  hideWinnerPanel();

  elements.eligibleList.innerHTML = eligible.length
    ? eligible.map((m) => `<li>${escapeHtml(m.name)}</li>`).join('')
    : '<li class="empty">None</li>';

  elements.receivedList.innerHTML = received.length
    ? received.map((m) => `<li>${escapeHtml(m.name)}</li>`).join('')
    : '<li class="empty">None yet</li>';

  const history = getHistorySorted();
  elements.historyBody.innerHTML = history.length
    ? history
        .map(
          (h) => `
        <tr>
          <td>${escapeHtml(h.month || '')}</td>
          <td>${escapeHtml(h.winnerName)}</td>
          <td class="amount">${formatCurrency(h.amount)}</td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="3" class="empty">No winners yet</td></tr>';
}

function hideWinnerPanel() {
  elements.winnerPanel.classList.add('hidden');
  pendingWinner = null;
}

// --- PIN protection ---

function openPinModal(mode) {
  pinModalMode = mode;
  elements.pinInput.value = '';
  elements.pinError.classList.add('hidden');

  if (mode === 'spin') {
    elements.pinModalTitle.textContent = 'Enter Spin PIN';
    elements.pinModalSubtitle.textContent = 'Enter the PIN to run the Bishi draw.';
    elements.pinSubmitBtn.textContent = 'Unlock & Spin';
  } else if (mode === 'change') {
    elements.pinModalTitle.textContent = 'Change Spin PIN';
    elements.pinModalSubtitle.textContent = 'Enter current PIN, then set a new one.';
    elements.pinSubmitBtn.textContent = 'Verify PIN';
  } else {
    elements.pinModalTitle.textContent = 'Set Spin PIN';
    elements.pinModalSubtitle.textContent = 'Create a 4–6 digit PIN to protect the wheel.';
    elements.pinSubmitBtn.textContent = 'Set PIN';
  }

  elements.pinModal.classList.remove('hidden');
  elements.pinInput.focus();
}

function closePinModal() {
  elements.pinModal.classList.add('hidden');
  elements.pinInput.value = '';
  elements.pinError.classList.add('hidden');
  pinModalMode = 'spin';
}

async function handlePinSubmit() {
  const pin = elements.pinInput.value.trim();
  elements.pinError.classList.add('hidden');

  if (pinModalMode === 'set') {
    if (!isValidPin(pin)) {
      elements.pinError.textContent = 'PIN must be 4–6 digits.';
      elements.pinError.classList.remove('hidden');
      return;
    }
    const confirmPin = prompt('Confirm new Spin PIN (4–6 digits):');
    if (!confirmPin || confirmPin.trim() !== pin) {
      elements.pinError.textContent = 'PIN confirmation did not match.';
      elements.pinError.classList.remove('hidden');
      return;
    }
    currentBishi.spinPinHash = await hashPin(pin);
    await saveBishi(currentBishi);
    closePinModal();
    renderDashboard();
    return;
  }

  if (pinModalMode === 'change') {
    if (!isValidPin(pin)) {
      elements.pinError.textContent = 'Enter your current 4–6 digit PIN.';
      elements.pinError.classList.remove('hidden');
      return;
    }
    const valid = await verifyPin(pin, currentBishi.spinPinHash);
    if (!valid) {
      elements.pinError.textContent = 'Wrong PIN. Try again.';
      elements.pinError.classList.remove('hidden');
      return;
    }
    const newPin = prompt('Enter new Spin PIN (4–6 digits):');
    if (!newPin || !isValidPin(newPin.trim())) {
      alert('New PIN must be 4–6 digits.');
      return;
    }
    const confirmNew = prompt('Confirm new Spin PIN:');
    if (confirmNew?.trim() !== newPin.trim()) {
      alert('New PIN confirmation did not match.');
      return;
    }
    currentBishi.spinPinHash = await hashPin(newPin.trim());
    await saveBishi(currentBishi);
    closePinModal();
    renderDashboard();
    return;
  }

  // spin mode
  if (!isValidPin(pin)) {
    elements.pinError.textContent = 'Enter your 4–6 digit PIN.';
    elements.pinError.classList.remove('hidden');
    return;
  }

  const valid = await verifyPin(pin, currentBishi.spinPinHash);
  if (!valid) {
    elements.pinError.textContent = 'Wrong PIN. Try again.';
    elements.pinError.classList.remove('hidden');
    elements.pinInput.value = '';
    elements.pinInput.focus();
    return;
  }

  closePinModal();
  executeSpin();
}

function handleRunBishiClick() {
  if (wheel.spinning || pendingWinner) return;

  const eligible = getEligibleMembers();
  if (eligible.length === 0) return;

  if (!currentBishi.spinPinHash) {
    if (confirm('No Spin PIN is set. Set one now to protect the wheel?')) {
      openPinModal('set');
    } else {
      executeSpin();
    }
    return;
  }

  openPinModal('spin');
}

async function executeSpin() {
  if (wheel.spinning || pendingWinner) return;

  const eligible = getEligibleMembers();
  if (eligible.length === 0) return;

  const winnerIndex = Math.floor(Math.random() * eligible.length);
  const winner = eligible[winnerIndex];
  const pool = currentBishi.monthlyAmount * currentBishi.numberOfMembers;

  elements.runBishiBtn.disabled = true;
  hideWinnerPanel();

  await wheel.spinToIndex(winnerIndex);

  pendingWinner = {
    member: winner,
    pool,
    month: getCurrentMonthLabel()
  };

  elements.winnerMessage.textContent = `🎉 ${winner.name} is the winner!`;
  elements.winnerPool.textContent = `Monthly Pool: ${formatCurrency(pool)}`;
  elements.winnerPanel.classList.remove('hidden');
  elements.runBishiBtn.disabled = false;
}

async function handleConfirmWinner() {
  if (!pendingWinner || !currentBishi) return;

  const { member, pool } = pendingWinner;

  const memberRef = currentBishi.members.find((m) => m.id === member.id);
  if (memberRef) {
    memberRef.received = true;
  }

  currentBishi.history.push({
    winnerId: member.id,
    winnerName: member.name,
    amount: pool,
    month: getCurrentMonthLabel(),
    confirmedAt: Date.now()
  });

  await saveBishi(currentBishi);
  hideWinnerPanel();
  renderDashboard();
}

function handleCancelWinner() {
  hideWinnerPanel();
  renderDashboard();
}


function openPreviousResultPanel() {
  populatePreviousWinnerOptions();
  elements.previousResultError.classList.add('hidden');
  elements.previousResultError.textContent = '';
  elements.previousMonth.value = '';
  elements.previousAmount.value = currentBishi.monthlyAmount || '';
  elements.previousResultPanel.classList.remove('hidden');
  elements.previousMonth.focus();
}

function closePreviousResultPanel() {
  elements.previousResultPanel.classList.add('hidden');
  elements.previousResultError.classList.add('hidden');
  elements.previousResultError.textContent = '';
}

function populatePreviousWinnerOptions() {
  const eligible = getEligibleMembers();
  elements.previousWinner.innerHTML = eligible.length
    ? eligible.map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join('')
    : '<option value="">No eligible members</option>';
  elements.previousWinner.disabled = eligible.length === 0;
}

function showPreviousResultError(message) {
  elements.previousResultError.textContent = message;
  elements.previousResultError.classList.remove('hidden');
}

async function handleSavePreviousResult() {
  if (!currentBishi) return;

  const monthValue = elements.previousMonth.value;
  const memberId = elements.previousWinner.value;
  const amount = Number(elements.previousAmount.value);

  if (!monthValue) {
    showPreviousResultError('Please select the previous month.');
    return;
  }
  if (!memberId) {
    showPreviousResultError('Please select a winner.');
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    showPreviousResultError('Enter a valid payout amount.');
    return;
  }

  const monthLabel = monthInputToLabel(monthValue);
  const monthKey = labelToMonthKey(monthLabel);
  if (monthKey === null) {
    showPreviousResultError('Invalid month.');
    return;
  }

  const startKey = labelToMonthKey(monthInputToLabel(currentBishi.startMonth));
  if (startKey !== null && monthKey < startKey) {
    showPreviousResultError(`Month cannot be before ${monthInputToLabel(currentBishi.startMonth)}.`);
    return;
  }

  const existingMonth = (currentBishi.history || []).some((h) => labelToMonthKey(h.month) === monthKey);
  if (existingMonth) {
    showPreviousResultError('A result already exists for this month.');
    return;
  }

  const member = currentBishi.members.find((m) => m.id === memberId);
  if (!member) {
    showPreviousResultError('Selected member was not found.');
    return;
  }
  if (member.received) {
    showPreviousResultError(`${member.name} has already received a payout.`);
    return;
  }

  currentBishi.history = currentBishi.history || [];
  currentBishi.history.push({
    winnerId: member.id,
    winnerName: member.name,
    amount,
    month: monthLabel,
    confirmedAt: Date.now(),
    imported: true
  });
  member.received = true;

  await saveBishi(currentBishi);
  closePreviousResultPanel();
  renderDashboard();
}

async function handleReset() {
  if (!confirm('Delete this Bishi and start over? All data will be lost.')) return;
  await deleteAllBishis();
  currentBishi = null;
  pendingWinner = null;
  elements.setupForm.reset();
  const now = new Date();
  elements.startMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  showScreen('setup');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
