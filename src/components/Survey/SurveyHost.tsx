import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmbeddedSurveyHost } from './EmbeddedSurveyHost';

export const SurveyHost: React.FC = () => {
  // Always use the EmbeddedSurveyHost component for both embedded and direct access
  // This ensures consistent behavior and the "Powered by SurveyServe" footer
  return <EmbeddedSurveyHost />;
};