import React from 'react';
import { TemplateGalleryEngine } from '../welcome/TemplateGalleryEngine';

export interface TemplatesGalleryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectTemplate?: (templateId: string) => void;
  onApplyTemplate?: (templateId: string, customConfig: any) => void;
}

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({
  isOpen = true,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <TemplateGalleryEngine
      mode="modal"
      onClose={onClose}
      onLaunchProject={() => {
        if (onSelectTemplate) {
          onSelectTemplate('active');
        }
        onClose();
      }}
    />
  );
};
