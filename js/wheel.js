class BishiWheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.members = [];
    this.rotation = 0;
    this.isSpinning = false;
    this.size = 280;
    this.setupCanvas();
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.size * dpr;
    this.canvas.height = this.size * dpr;
    this.canvas.style.width = this.size + 'px';
    this.canvas.style.height = this.size + 'px';
    this.ctx.scale(dpr, dpr);
  }

  setMembers(members) {
    this.members = members;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const center = this.size / 2;
    const radius = center - 8;
    const count = this.members.length;

    ctx.clearRect(0, 0, this.size, this.size);

    if (count === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No eligible members', center, center);
      return;
    }

    const sliceAngle = (Math.PI * 2) / count;
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8B500', '#82E0AA'
    ];

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(this.rotation);

    for (let i = 0; i < count; i++) {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 2;
      const name = this.members[i].name;
      const displayName = name.length > 10 ? name.slice(0, 9) + '…' : name;
      ctx.fillText(displayName, radius - 14, 5);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Pointer at top
    ctx.beginPath();
    ctx.moveTo(center, 4);
    ctx.lineTo(center - 10, 24);
    ctx.lineTo(center + 10, 24);
    ctx.closePath();
    ctx.fillStyle = '#E74C3C';
    ctx.fill();
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Spin to land on the member at targetIndex.
   * Returns a promise that resolves when animation completes.
   */
  spinToIndex(targetIndex) {
    return new Promise((resolve) => {
      if (this.isSpinning || this.members.length === 0) {
        resolve();
        return;
      }

      this.isSpinning = true;
      const count = this.members.length;
      const sliceAngle = (Math.PI * 2) / count;

      // Slice center angle in wheel-local coords (slice 0 starts at top)
      const sliceCenter = targetIndex * sliceAngle + sliceAngle / 2 - Math.PI / 2;
      // Pointer is fixed at top (-PI/2); rotate wheel so slice center aligns with pointer
      const targetRotation = -Math.PI / 2 - sliceCenter;

      const fullSpins = 5 + Math.floor(Math.random() * 3);
      const startRotation = this.rotation;

      // Find end rotation: same angle mod 2PI, but far enough ahead for animation
      let endRotation = targetRotation;
      while (endRotation <= startRotation + fullSpins * Math.PI * 2) {
        endRotation += Math.PI * 2;
      }

      const delta = endRotation - startRotation;
      const duration = 3500 + Math.random() * 1000;
      const startTime = performance.now();

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.rotation = startRotation + delta * eased;
        this.draw();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.rotation = endRotation;
          this.draw();
          this.isSpinning = false;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  get spinning() {
    return this.isSpinning;
  }
}
