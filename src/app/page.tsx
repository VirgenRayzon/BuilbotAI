import { getImageProps } from 'next/image';
import heroImage from '@/assets/landing/hero-custom.webp';
import LandingPage from '@/components/landing/landing-page';

export default function StartPage() {
  const { props } = getImageProps({
    src: heroImage,
    alt: 'BuildbotAI Custom PC Rig',
    fill: true,
    sizes: '100vw',
    priority: true,
  });

  return (
    <>
      {/* Discover the public hero before hydration without bypassing Auth UI gates.
          Match next/image's responsive candidates so the download is reused. */}
      <link
        rel="preload"
        as="image"
        href={props.src}
        imageSrcSet={props.srcSet}
        imageSizes={props.sizes}
        fetchPriority="high"
      />
      <LandingPage />
    </>
  );
}
