/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config';
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import { importMap } from './admin/importMap';
import React from 'react';

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) =>
  RootLayout({
    children,
    config,
    importMap,
    serverFunction: async function serverFunction(args: any) {
      'use server';
      return handleServerFunctions({
        ...args,
        config,
        importMap,
      });
    },
  });

export default Layout;
