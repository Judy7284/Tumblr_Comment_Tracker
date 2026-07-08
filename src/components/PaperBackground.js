function PaperBackground({ children }) {
  return (
    <div className="paper-background">

      <svg
        className="paper-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <filter id="rough-paper-page">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="4"
          />

          <feDisplacementMap
            in="SourceGraphic"
            scale="1.8"
          />
        </filter>

        <path
          d="
          M2,4
          C7,2 14,5 20,3
          C30,1 40,5 50,3
          C60,1 70,5 80,3
          C88,2 95,5 98,4

          L98,96

          C92,98 86,95 78,97
          C70,99 60,95 50,97
          C40,99 30,95 22,97
          C14,98 8,96 2,96

          Z
          "

          filter="url(#rough-paper-page)"
        />
      </svg>

      <div className="paper-content">
        {children}
      </div>

    </div>
  );
}

export default PaperBackground;