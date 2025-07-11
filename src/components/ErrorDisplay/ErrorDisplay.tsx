import React from 'react';
import styled from 'styled-components';

interface ErrorDisplayProps {
  error: {
    message: string;
    type: 'network' | 'validation' | 'server' | 'unknown';
    isRetryable: boolean;
    retryCount: number;
  } | null;
  onRetry?: () => void;
  onClear?: () => void;
}

const ErrorContainer = styled.div`
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ErrorContent = styled.div`
  flex: 1;
`;

const ErrorIcon = styled.span`
  color: #d32f2f;
  font-size: 20px;
  margin-right: 12px;
`;

const ErrorMessage = styled.p`
  color: #d32f2f;
  margin: 0;
  font-weight: 500;
`;

const ErrorType = styled.span`
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ variant }) =>
    variant === 'primary'
      ? `
    background: #1976d2;
    color: white;
    &:hover {
      background: #1565c0;
    }
  `
      : `
    background: transparent;
    color: #666;
    border: 1px solid #ddd;
    &:hover {
      background: #f5f5f5;
    }
  `}
`;

const getErrorIcon = (type: string) => {
  switch (type) {
    case 'network':
      return '🌐';
    case 'server':
      return '⚠️';
    case 'validation':
      return '❌';
    default:
      return '🚨';
  }
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onClear }) => {
  if (!error) return null;

  return (
    <ErrorContainer>
      <ErrorContent>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <ErrorIcon>{getErrorIcon(error.type)}</ErrorIcon>
          <ErrorMessage>{error.message}</ErrorMessage>
        </div>
        <ErrorType>
          {error.type} error
          {error.retryCount > 0 && ` (attempt ${error.retryCount})`}
        </ErrorType>
      </ErrorContent>
      
      <ActionButtons>
        {error.isRetryable && onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Retry
          </Button>
        )}
        {onClear && (
          <Button variant="secondary" onClick={onClear}>
            Dismiss
          </Button>
        )}
      </ActionButtons>
    </ErrorContainer>
  );
};

export default ErrorDisplay; 