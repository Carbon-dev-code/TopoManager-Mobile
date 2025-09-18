import "./Cube.css";

interface CubeProps {
  color: string; // couleur principale
}

const Cube: React.FC<CubeProps> = ({ color }) => {
  // Ajouter de l'opacité au background
  const backgroundColorWithOpacity = color.includes("rgba")
    ? color
    : color + "33"; // "33" = ~20% opacity en hex

  return (
    <div
      className="cube-custom"
      style={{
        backgroundColor: backgroundColorWithOpacity,
        border: `2px solid ${color}`, // border dynamique
      }}
    ></div>
  );
};
export default Cube;