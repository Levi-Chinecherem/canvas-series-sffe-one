const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// global settings
ctx.lineCap = 'round';
ctx.lineWidth = 1;
const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, 0);
gradient1.addColorStop(0, 'red');
gradient1.addColorStop(0.25, 'green');
gradient1.addColorStop(0.5, 'blue');
gradient1.addColorStop(0.75, 'white');

class Particle {
  constructor(effect){
    this.effect = effect;
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.speedX = 0;
    this.speedY = 0;
    this.speedModifier = Math.random() * 3 + 0.1;
    this.colors = ['#3C49B6', '#3C6BB1', '#3C8BAC', '#3BA7A6','white'];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.history = [{ x: this.x, y: this.y }];
    //this.lineWidth = Math.floor(Math.random() * 3 + 1);;
    this.maxLength = Math.floor(Math.random() * 200 + 1);
    this.timer = this.maxLength * 4;
    this.angle;
  }
  update() {
    if (this.timer >= 1){
      this.timer-= 1;
      // map particle position to a flow field grid cell to get angle value that will be used for speed and movement direction
      let x = Math.floor(this.x / this.effect.cellSize);
      let y = Math.floor(this.y / this.effect.cellSize);
      let index = y * this.effect.cols + x;
      this.angle = this.effect.flowField[index];

      // update particle position
      this.speedX = this.speedModifier * Math.cos(this.angle);
      this.speedY = this.speedModifier * Math.sin(this.angle);

      // add current particle position into history array
      this.history.push({ x: this.x, y: this.y });

      // if longer than max length, remove the oldest segment
      if (this.history.length > this.maxLength) this.history.shift();

      // move particle in a direction
      this.x += this.speedX;
      this.y += this.speedY;
    } else if (this.timer <= 0 && this.history.length >= 2){
      this.history.shift();
    } else {
      this.reset();
    }
  }
  reset(){
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.timer = this.maxLength * 2;
    this.history = [{ x: this.x, y: this.y }];
    this.opacity = 1;
  }
  draw(context) {
    context.save();
    context.globalAlpha = this.opacity;
    //context.lineWidth = this.lineWidth;
    context.strokeStyle = this.color;
    context.fillStyle = this.color;
    context.beginPath();
    context.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 0; i < this.history.length; i++) {
      context.lineTo(this.history[i].x, this.history[i].y);
    }
    context.stroke();
    context.restore();  
  }
}

class Effect {
  constructor(canvas){
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.particles = [];
    this.numberOfParticles = 1500;
    this.cellSize = 7; //flow field cell size
    this.rows;
    this.cols;
    this.flowField = [];
    this.zoom = 0.003;
    this.curve = 2;
    this.debug = false;
    window.addEventListener('keydown', e => {
      if (e.key === 'd') this.debug = !this.debug;
    });
    window.addEventListener('resize', e => {
      console.log(e.currentTarget.innerWidth, e.currentTarget.innerHeight)
      this.resize(e.currentTarget.innerWidth, e.currentTarget.innerHeight);
    });
  }
  getAngle(x, y) {
    return ((Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * this.curve).toFixed(1);
  }
  init(){
    // create flow field (grid of angles)
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);
    this.flowField = [];
    for (let y = 0; y <= this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let angle = this.getAngle(x * this.cellSize, y * this.cellSize);
        this.flowField.push(angle);
      }
    }
    // create particles
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }
  resize(width, height){
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.particles = [];
    this.init();
  }
  render(context){
    context.fillStyle = '#553CBB';
    context.fillRect(0, 0, this.width, this.height);
    this.particles.forEach(particle => {
      particle.update();
      particle.draw(context);
    });
    // draw flow field grid for debugging
    if (this.debug){
      context.save();
      context.strokeStyle = 'white';
      context.lineWidth = 0.3;
      for (let a = 0; a < this.cols; a++){
        context.beginPath();
        context.moveTo(this.cellSize * a, 0);
        context.lineTo(this.cellSize * a, this.height);
        context.stroke();
      }
      for (let b = 0; b < this.rows; b++){
        context.beginPath();
        context.moveTo(0, this.cellSize * b);
        context.lineTo(this.width, this.cellSize * b);
        context.stroke();
      }
      context.restore();
    }
  }
}

const effect = new Effect(canvas);
effect.init();
console.log(effect.flowField)

function animate(){
  effect.render(ctx);
  requestAnimationFrame(animate);
}
animate();