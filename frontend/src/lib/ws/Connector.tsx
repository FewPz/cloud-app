'use client';

import { FC, useEffect } from "react";
import { useWS } from ".";

interface Props {
  children?: React.ReactNode;
}

const WSConnector: FC<Props> = ({ children }) => {
  const connect = useWS((state) => state.connect);

  useEffect(() => {
    connect();
  }, []);

  return <>{children}</>;
}

export default WSConnector