'use client'

import { FC, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const GameLayout: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen w-full px-4 pb-12 pt-16 sm:px-8 sm:pt-20">
      {children}
    </div>
  );
};

export default GameLayout;
