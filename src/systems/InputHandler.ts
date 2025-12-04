import { IInputHandler } from '@/core/Interfaces';
import { LaneDirection } from '@/core/Config';

/**
 * InputHandler - Processes keyboard and touch input
 * Single Responsibility: Input detection and translation to game commands
 */
export class InputHandler implements IInputHandler {
  private inputQueue: LaneDirection[] = [];
  private touchStartX: number = 0;
  private keyStates: Map<string, boolean> = new Map();
  private lastKeyPressTime: Map<string, number> = new Map();

  private handleKeyDown = this.onKeyDown.bind(this);
  private handleKeyUp = this.onKeyUp.bind(this);
  private handleTouchStart = this.onTouchStart.bind(this);
  private handleTouchMove = this.onTouchMove.bind(this);
  private handleTouchEnd = this.onTouchEnd.bind(this);

  /**
   * Initialize input listeners
   */
  public initialize(): void {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Touch events
    window.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    window.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    window.addEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Get current input direction from queue
   */
  public getInputDirection(): LaneDirection {
    if (this.inputQueue.length > 0) {
      return this.inputQueue.shift()!;
    }
    return LaneDirection.NONE;
  }

  /**
   * Handle keyboard key down
   */
  private onKeyDown(event: KeyboardEvent): void {
    const now = performance.now();
    const debounceTime = 100; // milliseconds

    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      const lastPress = this.lastKeyPressTime.get('left') || 0;
      if (!this.keyStates.get('left') || now - lastPress > debounceTime) {
        this.inputQueue.push(LaneDirection.LEFT);
        this.lastKeyPressTime.set('left', now);
      }
      this.keyStates.set('left', true);
      event.preventDefault();
    } else if (
      event.key === 'ArrowRight' ||
      event.key === 'd' ||
      event.key === 'D'
    ) {
      const lastPress = this.lastKeyPressTime.get('right') || 0;
      if (!this.keyStates.get('right') || now - lastPress > debounceTime) {
        this.inputQueue.push(LaneDirection.RIGHT);
        this.lastKeyPressTime.set('right', now);
      }
      this.keyStates.set('right', true);
      event.preventDefault();
    }
  }

  /**
   * Handle keyboard key up
   */
  private onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      this.keyStates.set('left', false);
    } else if (
      event.key === 'ArrowRight' ||
      event.key === 'd' ||
      event.key === 'D'
    ) {
      this.keyStates.set('right', false);
    }
  }

  /**
   * Handle touch start
   */
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
    }
    event.preventDefault();
  }

  /**
   * Handle touch move - detect swipe direction
   */
  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0 && this.touchStartX > 0) {
      const currentX = event.touches[0].clientX;
      const deltaX = currentX - this.touchStartX;
      const threshold = 50; // Minimum swipe distance in pixels

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          this.inputQueue.push(LaneDirection.RIGHT);
        } else {
          this.inputQueue.push(LaneDirection.LEFT);
        }
        this.touchStartX = 0; // Reset to prevent multiple triggers
      }
    }
    event.preventDefault();
  }

  /**
   * Handle touch end
   */
  private onTouchEnd(event: TouchEvent): void {
    this.touchStartX = 0;
    event.preventDefault();
  }

  /**
   * Clean up event listeners
   */
  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }
}
