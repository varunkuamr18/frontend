import React from 'react';
import styled from 'styled-components';

const NormalLoader = () => {
  return (
    <StyledWrapper>
      <div className="spinner" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .spinner {
    width: 56px;
    height: 56px;
    display: grid;
    border-radius: 50%;
    -webkit-mask: radial-gradient(farthest-side,#0000 40%,#6121d1 41%);
    background: 
      linear-gradient(0deg, rgba(97,33,209,0.5) 50%, rgba(97,33,209,1) 0) center/4.5px 100%,
      linear-gradient(90deg, rgba(97,33,209,0.25) 50%, rgba(97,33,209,0.75) 0) center/100% 4.5px;
    background-repeat: no-repeat;
    animation: spinner-d3o0rx 1s infinite steps(12);
  }

  .spinner::before,
  .spinner::after {
    content: "";
    grid-area: 1/1;
    border-radius: 50%;
    background: inherit;
    opacity: 0.915;
    transform: rotate(30deg);
  }

  .spinner::after {
    opacity: 0.83;
    transform: rotate(60deg);
  }

  @keyframes spinner-d3o0rx {
    100% {
      transform: rotate(1turn);
    }
  }
`;


export default NormalLoader;
