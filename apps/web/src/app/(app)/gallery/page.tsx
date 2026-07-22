import type { Metadata } from 'next';

import { ComponentGallery } from './component-gallery';

export const metadata: Metadata = { title: 'Component Gallery' };

export default function GalleryPage() {
  return <ComponentGallery />;
}
