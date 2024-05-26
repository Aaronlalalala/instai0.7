import React, { useRef, useEffect } from 'react';

class LCG {
  constructor(seed = 123456789) {
    this.seed = seed;
  }

  nextFloat() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

const lcg = new LCG();

class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  append(data) {
    const node = new Node(data);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
  }

  remove(node) {
    if (this.head === node) {
      this.head = this.head.next;
      if (this.tail === node) {
        this.tail = null;
      }
    } else {
      let prev = this.head;
      while (prev.next && prev.next !== node) {
        prev = prev.next;
      }
      if (prev.next) {
        prev.next = prev.next.next;
        if (this.tail === node) {
          this.tail = prev;
        }
      }
    }
  }

  forEach(callback) {
    let curr = this.head;
    while (curr) {
      callback(curr.data);
      curr = curr.next;
    }
  }
}

class Star {
  constructor(windowWidth) {
    this.x = windowWidth * lcg.nextFloat();
    this.y = 5000 * lcg.nextFloat();
    this.text = ".";
    this.color = "white";
  }

  getColor() {
    let _r = lcg.nextFloat();
    this.color = _r < 0.5 ? "#333" : "white";
  }

  draw(context) {
    context.fillStyle = this.color;
    context.fillText(this.text, this.x, this.y);
  }
}

class MeteorRain {
  constructor(windowWidth, windowHeight) {
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
    this.x = -1;
    this.y = -1;
    this.length = -1;
    this.angle = 30;
    this.width = -1;
    this.height = -1;
    this.speed = 1;
    this.offset_x = -1;
    this.offset_y = -1;
    this.alpha = 1;
    this.color1 = "";
    this.color2 = "";
  }

  getRandomColor() {
    let a = Math.ceil(255 - 240 * lcg.nextFloat());
    this.color1 = "rgba(" + a + "," + a + "," + a + ",1)";
    this.color2 = "black";
  }

  getPos() {
    this.x = lcg.nextFloat() * this.windowWidth; // 窗口高度
    this.y = lcg.nextFloat() * this.windowHeight * 0.5; 
  }

  countPos() {
    this.x = this.x - this.offset_x;
    this.y = this.y + this.offset_y;
  }

  init() {
    this.getPos();
    this.alpha = 1; 
    this.getRandomColor();
    let x = lcg.nextFloat() * 80 + 150;
    this.length = Math.ceil(x);
    x = lcg.nextFloat() + 0.5;
    this.speed = Math.ceil(x); //流星的速度
    let cos = Math.cos((this.angle * 3.14) / 180);
    let sin = Math.sin((this.angle * 3.14) / 180);
    this.width = this.length * cos;
    this.height = this.length * sin;
    this.offset_x = this.speed * cos;
    this.offset_y = this.speed * sin;
  }

  draw(context) {
    context.save();
    context.beginPath();
    context.lineWidth = 1; 
    context.globalAlpha = this.alpha; 
    let line = context.createLinearGradient(
      this.x,
      this.y,
      this.x + this.width,
      this.y - this.height
    );

    line.addColorStop(0, "white");
    line.addColorStop(0.3, this.color1);
    line.addColorStop(0.6, this.color2);
    context.strokeStyle = line;
   
    context.moveTo(this.x, this.y);
    
    context.lineTo(this.x + this.width, this.y - this.height);
    context.closePath();
    context.stroke();
    context.restore();
  }

  move(context) {
    
    let x = this.x + this.width - this.offset_x;
    let y = this.y - this.height;
    context.clearRect(x - 3, y - 3, this.offset_x + 5, this.offset_y + 5);
    
    this.countPos();
   
    this.alpha -= 0.002;
   
    this.draw(context);
  }
}

const MeteorShower = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    canvas.width = windowWidth;
    canvas.height = windowHeight;

    const starCount = 30; // 星星數量
    const stars = new LinkedList();
    const rainCount = 12; // 流動數量
    const rains = new LinkedList();

    for (let i = 0; i < starCount; i++) {
      let star = new Star(windowWidth);
      star.getColor();
      star.draw(context);
      stars.append(star);
    }

    function playStars() {
      stars.forEach(star => {
        star.getColor();
        star.draw(context);
      });
      requestAnimationFrame(playStars);
    }

    for (let i = 0; i < rainCount; i++) {
      let rain = new MeteorRain(windowWidth, windowHeight);
      rain.init();
      rain.draw(context);
      rains.append(rain);
    }

    function playRains() {
      let curr = rains.head;
      while (curr) {
        let rain = curr.data;
        rain.move(context);
        if (rain.y > windowHeight) {
          context.clearRect(rain.x, rain.y - rain.height, rain.width, rain.height);
          rains.remove(curr);
          let newRain = new MeteorRain(windowWidth, windowHeight);
          newRain.init();
          newRain.draw(context);
          rains.append(newRain);
        }
        curr = curr.next;
      }
      requestAnimationFrame(playRains);
    }

    playStars();
    playRains();
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', width: '100%', height: '100%', top: 0, left: 0  }} />;
};

export default MeteorShower;
