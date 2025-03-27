class Firework {
    constructor(canvasWidth, canvasHeight) {
        const launchAreaWidth = canvasWidth * 0.2;
        this.x = (canvasWidth - launchAreaWidth) / 2 + Math.random() * launchAreaWidth;
        this.y = canvasHeight;
        this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.velocity = {
            x: Math.random() * 6 - 3,
            y: Math.random() * -3 - 3
        };
        this.particles = [];
        this.life = 60;
    }

    update(ctx) {
        this.life--;

        if (this.life > 0) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.y += 0.05; // Gravity effect

            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.particles.length === 0) {
            this.explode();
        }

        this.particles.forEach((particle, index) => {
            particle.update();
            particle.draw(ctx);
            if (particle.alpha <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            this.particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    isDead() {
        return this.life <= 0 && this.particles.length === 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.05;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
