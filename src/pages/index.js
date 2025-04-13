import { useEffect } from 'react';
import Head from 'next/head';
import MeshGenerator from '../components/MeshGenerator';

export default function Home() {
  return (
    <>
      <Head>
        <title>Unreal Engine Mesh Creator</title>
        <meta name="description" content="Create and export 3D meshes compatible with Unreal Engine" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <MeshGenerator />
      </main>
    </>
  );
}
