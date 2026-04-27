import {ReactNode, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

interface ModalPortalProps {
  children: ReactNode;
  blockScroll?: boolean;
}

const ModalPortal = ({children, blockScroll = true}: ModalPortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (blockScroll) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [blockScroll]);

  if (!mounted) return null;

  return createPortal(children, document.body);
};

export default ModalPortal;