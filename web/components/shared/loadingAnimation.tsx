import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

import * as chicky from "../../public/lottie/Polite Chicky.json";
import * as hamster from "../../public/lottie/Aniki Hamster.json";
import * as plane from "../../public/lottie/Paper Airplane.json";
import * as PartyParrot from "../../public/lottie/PartyParrot.json";
import * as Pacman from "../../public/lottie/Pacman.json";
import * as Cube from "../../public/lottie/cube.json";

type Animation =
  | typeof chicky
  | typeof hamster
  | typeof plane
  | typeof PartyParrot
  | typeof Pacman;

interface LoadingAnimationProps {
  title?: string;
  height?: number;
  width?: number;
  animation?: Animation;
}

const LoadingAnimation = ({
  title,
  animation: defaultAnimation,
  height = 300,
  width = 300,
}: LoadingAnimationProps) => {
  const animation = defaultAnimation || Cube;

  return (
    <div className="flex flex-col items-center justify-center align-middle w-full space-y-4">
      <Lottie animationData={animation} style={{ height, width }} loop={true} />
      {title && (
        <p className="font-medium text-lg text-gray-900 dark:text-gray-100">
          {title}
        </p>
      )}
    </div>
  );
};

export default LoadingAnimation;
