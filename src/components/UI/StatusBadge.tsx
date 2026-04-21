import React from 'react';
import type { AnalysisStatus } from '../../types';

interface StatusBadgeProps {
  status: AnalysisStatus | 'good' | 'needs_work' | 'urgent';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const getStyles = () => {
    switch (status) {
      case 'complete':
      case 'good':
        return 'status-badge-good';
      case 'analyzing':
      case 'pending':
      case 'needs_work':
        return 'status-badge-needs-work';
      case 'failed':
      case 'urgent':
        return 'status-badge-urgent';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'good': return '✓ Good';
      case 'needs_work': return '⚠️ Needs Work';
      case 'urgent': return '❌ Urgent';
      case 'analyzing': return '⏳ Analyzing';
      default: return status;
    }
  };

  return (
    <span className={`status-badge ${getStyles()} ${className}`}>
      {getLabel()}
    </span>
  );
};
