"use client";
import { useRef, useState, useEffect, useCallback } from 'react';
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

type FallingState = 'idle' | 'falling' | 'atBottom' | 'waiting' | 'fading' | 'dismissed';

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

  const [state, setState] = useState<FallingState>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem("fallingTextDismissed") === "true") {
      return 'dismissed';
    }
    return 'idle';
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Handle prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && state === 'falling') {
      // If they prefer reduced motion, we could either not start at all or just skip to a static state
      // For now, let's just not start the falling effect if they prefer reduced motion
      setState('idle');
    }
  }, [state]);

  useEffect(() => {
    if (state === 'dismissed' || !textRef.current) return;
    const words = text.split(' ');

    const newHTML = words
      .map(word => {
        const isHighlighted = highlightWords.some(hw => word.startsWith(hw));
        return `<span
          class="inline-block mx-[2px] select-none ${isHighlighted ? highlightClass : ''} transition-opacity duration-[5000ms] ease-in-out"
        >
          ${word}
        </span>`;
      })
      .join(' ');

    textRef.current.innerHTML = newHTML;
  }, [text, highlightWords, state, highlightClass]);

  useEffect(() => {
    if (state !== 'idle') return;

    if (trigger === 'auto') {
      setState('falling');
      return;
    }
    if (trigger === 'scroll' && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setState('falling');
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [trigger, state]);

  useEffect(() => {
    if (state !== 'falling') return;

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

    let checkBottomTriggered = false;

    Events.on(engine, 'afterUpdate', () => {
      let allAtBottom = true;
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;

        // Detect if word has reached bottom area (floor is at height-10, thickness 50, so top is height-35)
        if (y < height - 60) {
          allAtBottom = false;
        }
      });

      if (allAtBottom && !checkBottomTriggered && wordBodies.length > 0) {
        checkBottomTriggered = true;
        setState('atBottom');
      }
    });

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas && canvasContainerRef.current && canvasContainerRef.current.contains(render.canvas)) {
        canvasContainerRef.current.removeChild(render.canvas);
      }
      World.clear(engine.world, false);
      Engine.clear(engine);
      Events.off(engine, 'afterUpdate', () => {});
    };
  }, [state, gravity, wireframes, backgroundColor, mouseConstraintStiffness]);

  // Handle transitions after reaching bottom
  useEffect(() => {
    if (state === 'atBottom') {
      setState('waiting');
      timerRef.current = setTimeout(() => {
        setState('fading');
      }, 5000);
    } else if (state === 'fading') {
      // Trigger fade out in DOM
      if (textRef.current) {
        const spans = textRef.current.querySelectorAll('span');
        spans.forEach(span => {
          (span as HTMLElement).style.opacity = '0';
        });
      }
      
      timerRef.current = setTimeout(() => {
        sessionStorage.setItem("fallingTextDismissed", "true");
        setState('dismissed');
      }, 5000);
    }
  }, [state]);

  const handleTrigger = useCallback(() => {
    if (state === 'idle' && (trigger === 'click' || trigger === 'hover')) {
      setState('falling');
    }
  }, [state, trigger]);

  if (state === 'dismissed') return null;

  return (
    <div
      ref={containerRef}
      className="relative z-[1] w-full min-h-[100px] cursor-pointer text-center pt-8 no-scrollbar"
      onClick={trigger === 'click' ? handleTrigger : undefined}
      onMouseEnter={trigger === 'hover' ? handleTrigger : undefined}
      onFocus={handleTrigger}
      tabIndex={0}
      aria-label="Interactive falling text"
    >
      <div
        ref={textRef}
        className="inline-block"
        style={{
          fontSize,
          lineHeight: 1.4,
          // Hide original text once physics starts to avoid double text
          visibility: state === 'idle' ? 'visible' : 'visible' 
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