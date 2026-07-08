function ParchmentCard({ children, className = "" }) {
  return (
    <div className={`parchment-card ${className}`}>
      <svg className="parchment-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <filter id="rough-paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" />
          <feDisplacementMap in="SourceGraphic" scale="1.5" />
        </filter>

        <path
          d="M3,4 
             C8,2 14,5 20,3 
             C28,1 35,5 42,3 
             C50,1 58,4 66,3 
             C74,2 82,5 97,4
             L96,96
             C86,98 78,95 70,97
             C60,99 51,95 42,97
             C33,99 24,95 15,97
             C9,98 5,96 3,96
             Z"
          filter="url(#rough-paper)"
        />
      </svg>

      <div className="parchment-content">
        {children}
      </div>
    </div>
  );
}

export default ParchmentCard;