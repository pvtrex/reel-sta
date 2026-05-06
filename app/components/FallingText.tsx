"use client";
import { useRef, useState, useEffect, useMemo } from 'react';
import Matter from 'matter-js';

interface FallingTextProps {
  text?: string;
  highlightWords?: string[];
  highlightClass?: string;
  trigger?: 'auto' | 'scroll' | 'click' | 'hover';
  backgroundColor?: string;
  wireframes?: boolean;
  gravity?: number;
  mouseConstraintStiffness?: number;
  fontSize?: string;
}

type ComponentStatus = 'idle' | 'waiting' | 'fading' | 'dismissed';

const FallingText: React.FC<FallingTextProps> = ({
  text = '',
  highlightWords = [],
  highlightClass = 'text-cyan-500 font-bold',
  trigger = 'auto',
  backgroundColor = 'transparent',
  wireframes = false,
  gravity = 1,
  mouseConstraintStiffness = 0.2,
  fontSize = '1rem'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState<ComponentStatus>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('fallingTextDismissed') === 'true' ? 'dismissed' : 'idle';
    }
    return 'idle';
  });

  // Handle initialization of text HTML
  useEffect(() => {
    if (!textRef.current || status === 'dismissed') return;
    const words = text.split(' ');

    const newHTML = words
      .map(word => {
        const isHighlighted = highlightWords.some(hw => word.startsWith(hw));
        return `<span
          class="inline-block mx-[2px] select-none ${isHighlighted ? highlightClass : ''}"
        >
          ${word}
        </span>`;
      })
      .join(' ');

    textRef.current.innerHTML = newHTML;
  }, [text, highlightWords, status]);

  // Handle auto-trigger and scroll-trigger
  useEffect(() => {
    if (status !== 'idle') return;

    if (trigger === 'auto') {
      setStatus('waiting');
      return;
    }
    if (trigger === 'scroll' && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setStatus('waiting');
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [trigger, status]);

  // Handle state transitions (waiting -> fading -> dismissed)
  useEffect(() => {
    if (status === 'waiting') {
      timerRef.current = setTimeout(() => {
        setStatus('fading');
      }, 5000);
    } else if (status === 'fading') {
      timerRef.current = setTimeout(() => {
        setStatus('dismissed');
        sessionStorage.setItem('fallingTextDismissed', 'true');
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status]);

  // Physics Effect
  useEffect(() => {
    if (status === 'idle' || status === 'dismissed') return;

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint, Events } = Matter;

    if (!containerRef.current || !canvasContainerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const containerTop = containerRect.top + window.scrollY;
    
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );
    
    const height = Math.max(docHeight - containerTop - 20, containerRect.height);

    if (width <= 0 || height <= 0) return;

    const engine = Engine.create();
    engine.world.gravity.y = gravity;

    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height,
        background: backgroundColor,
        wireframes
      }
    });

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: 'transparent' }
    };

    const floor = Bodies.rectangle(width / 2, height - 10, width, 50, boundaryOptions);
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions);
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, boundaryOptions);
    const ceiling = Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions);

    if (!textRef.current) return;
    const wordSpans = textRef.current.querySelectorAll('span');
    const wordBodies = [...wordSpans].map(elem => {
      const rect = elem.getBoundingClientRect();

      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        render: { fillStyle: 'transparent' },
        restitution: 0.8,
        frictionAir: 0.01,
        friction: 0.2
      });
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 5,
        y: 0
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

      return { elem, body };
    });

    wordBodies.forEach(({ elem, body }) => {
      elem.style.position = 'absolute';
      elem.style.left = `${body.position.x}px`;
      elem.style.top = `${body.position.y}px`;
      elem.style.transform = 'translate(-50%, -50%)';
    });

    const mouse = Mouse.create(containerRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false }
      }
    });
    render.mouse = mouse;

    World.add(engine.world, [floor, leftWall, rightWall, ceiling, mouseConstraint, ...wordBodies.map(wb => wb.body)]);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    Events.on(engine, 'afterUpdate', () => {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
    });

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas && canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = ''; // Safer than removeChild
      }
      World.clear(engine.world, false);
      Engine.clear(engine);
      Events.off(engine, 'afterUpdate', () => {});
    };
  }, [status === 'idle' || status === 'dismissed', gravity, wireframes, backgroundColor, mouseConstraintStiffness]);

  const handleTrigger = () => {
    if (status === 'idle' && (trigger === 'click' || trigger === 'hover')) {
      setStatus('waiting');
    }
  };

  if (status === 'dismissed') return null;

  return (
    <div
      ref={containerRef}
      className="relative z-[1] w-full min-h-[100px] cursor-pointer text-center pt-8 no-scrollbar"
      style={{
        transition: 'opacity 5s ease-in-out',
        opacity: status === 'fading' ? 0 : 1
      }}
      onClick={trigger === 'click' ? handleTrigger : undefined}
      onMouseEnter={trigger === 'hover' ? handleTrigger : undefined}
    >
      <div
        ref={textRef}
        className="inline-block"
        style={{
          fontSize,
          lineHeight: 1.4
        }}
      />

      <div 
        className="absolute top-0 left-0 z-0 pointer-events-none no-scrollbar" 
        ref={canvasContainerRef} 
      />
    </div>
  );
};

export default FallingText;