import React from 'react';
import styled from 'styled-components';

const AddButton = () => {
  return (
    <StyledWrapper className="fixed bottom-6 right-6 z-20">
      <div data-tooltip="New" className="button glossy-button flex items-center justify-center">
        <div className="button-wrapper">
          <div className="text">Create Workspace</div>
          <span className="icon">
            <svg viewBox="0 0 16 16" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1a.5.5 0 0 1 .5.5V7.5H14a.5.5 0 0 1 0 1H8.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V1.5A.5.5 0 0 1 8 1z" />
            </svg>
          </span>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button {
    --width: 140px;
    --height: 40px;
    --tooltip-height: 30px;
    --tooltip-width: 80px;
    --gap-between-tooltip-to-button: 12px;
    width: var(--width);
    height: var(--height);
    position: relative;
    text-align: center;
    border-radius: 12px;
    font-family: 'Inter', 'Arial', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s ease;
    color: #ec4899; /* Pink-500 */
  }

  .button::before {
    position: absolute;
    content: attr(data-tooltip);
    width: var(--tooltip-width);
    height: var(--tooltip-height);
    background: rgba(88, 28, 135, 0.95); /* Purple-900 with 95% opacity */
    border: 1px solid rgba(236, 72, 153, 0.3); /* Pink-500 with 30% opacity */
    font-size: 0.75rem;
    color: #fff;
    border-radius: 8px;
    line-height: var(--tooltip-height);
    top: calc(-1 * (var(--tooltip-height) + var(--gap-between-tooltip-to-button)));
    left: calc(50% - var(--tooltip-width) / 2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
  }

  .button::after {
    position: absolute;
    content: '';
    width: 0;
    height: 0;
    border: 6px solid transparent;
    border-bottom-color: rgba(88, 28, 135, 0.95); /* Purple-900 with 95% opacity */
    left: calc(50% - 6px);
    top: calc(-1 * (var(--tooltip-height) + var(--gap-between-tooltip-to-button) - 6px));
  }

  .button::after,
  .button::before {
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .button-wrapper,
  .text,
  .icon {
    overflow: hidden;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
  }

  .text {
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    transition: top 0.4s ease;
  }

  .icon {
    top: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: top 0.4s ease;
  }

  .icon svg {
    width: 20px;
    height: 20px;
  }

  .button:hover .text {
    top: -100%;
  }

  .button:hover .icon {
    top: 0;
  }

  .button:hover::before,
  .button:hover::after {
    opacity: 1;
    visibility: visible;
  }

  .button:hover::before {
    top: calc(-1 * (var(--tooltip-height) + var(--gap-between-tooltip-to-button) + 4px));
  }

  .button:hover::after {
    top: calc(-1 * (var(--tooltip-height) + var(--gap-between-tooltip-to-button) - 2px));
  }
`;

export default AddButton;