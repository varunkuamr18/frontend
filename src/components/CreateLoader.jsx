import React from 'react';
import styled, { keyframes } from 'styled-components';

const CreateLoader = () => {
  return (
    <LoaderContainer>
      <Loader>
        <div className="dot-pulse" />
      </Loader>
    </LoaderContainer>
  );
};

// Animation keyframes
const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
`;

const orbit = keyframes`
  0% {
    transform: rotate(0deg) translateX(20px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(20px) rotate(-360deg);
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: rgba(255, 255, 255, 0.8);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
`;

const Loader = styled.div`
  position: relative;
  width: 100px;
  height: 100px;

  .dot-pulse {
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #6366f1;
    color: #6366f1;
    animation: ${pulse} 1.5s infinite ease-in-out;
    
    &::before,
    &::after {
      content: '';
      display: inline-block;
      position: absolute;
      top: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #6366f1;
    }
    
    &::before {
      left: -30px;
      animation: ${pulse} 1.5s infinite ease-in-out;
      animation-delay: -0.3s;
    }
    
    &::after {
      left: 30px;
      animation: ${pulse} 1.5s infinite ease-in-out;
      animation-delay: 0.3s;
    }
  }

  .orbit-loader {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #6366f1;
    animation: ${orbit} 2s linear infinite;
    
    &:nth-child(2) {
      animation-delay: -0.4s;
    }
    
    &:nth-child(3) {
      animation-delay: -0.8s;
    }
    
    &:nth-child(4) {
      animation-delay: -1.2s;
    }
  }
`;

export default CreateLoader;