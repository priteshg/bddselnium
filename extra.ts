<div class="legend">
  <span class="legend-item">
    <span class="dot playwright"></span> Playwright
  </span>
  <span class="legend-item">
    <span class="dot jest"></span> Jest
  </span>
</div>



.legend {
  display: flex;
  gap: 16px;
  margin: 10px 0 6px 0;
  font-size: 13px;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.dot.playwright {
  background-color: #d9534f; /* red */
}

.dot.jest {
  background-color: #337ab7; /* blue */
}