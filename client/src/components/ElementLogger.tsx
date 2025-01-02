
import { useEffect } from 'react';
import { Button } from './ui/button';

export function ElementLogger() {
  const logElement = async () => {
    try {
      const el = await webflow.getSelectedElement();
      console.log('Selected element:', el);
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
