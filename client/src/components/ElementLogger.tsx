
import { useEffect } from 'react';
import { Button } from './ui/button';
import type { WebflowAPI } from '@webflow/designer-extension-typings';

declare global {
  interface Window {
    webflow: WebflowAPI;
  }
}

export function ElementLogger() {
  const logElement = async () => {
    try {
      if (window.webflow) {
        const el = await window.webflow.getSelectedElement();
        console.log('Selected element:', el);
      } else {
        console.error('Webflow API not available');
      }
    } catch (error) {
      console.error('Error getting selected element:', error);
    }
  };

  return (
    <div className="p-4">
      <Button onClick={logElement}>Log Selected Element</Button>
    </div>
  );
}
