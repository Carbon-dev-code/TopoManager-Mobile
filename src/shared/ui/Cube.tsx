import "./Cube.css";

interface CubeProps {
  color: string;
}

const Cube: React.FC<CubeProps> = ({ color }) => {
  const backgroundColorWithOpacity = color.includes("rgba") ? color : color + "33";

  return (
    <div
      className="cube-custom"
      style={{
        backgroundColor: backgroundColorWithOpacity,
        border: `2px solid ${color}`,
      }}
    ></div>
  );
};

export default Cube;

