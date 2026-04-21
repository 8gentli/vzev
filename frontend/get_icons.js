import { renderToStaticMarkup } from 'react-dom/server';
import { GiVacuumCleaner } from 'react-icons/gi';
import { BiSolidWasher } from 'react-icons/bi';
import { MdOutlineSoupKitchen, MdHeatPump } from 'react-icons/md';
import React from 'react';

console.log('Vacuum:', renderToStaticMarkup(React.createElement(GiVacuumCleaner)));
console.log('Washer:', renderToStaticMarkup(React.createElement(BiSolidWasher)));
console.log('Kitchen:', renderToStaticMarkup(React.createElement(MdOutlineSoupKitchen)));
console.log('HeatPump:', renderToStaticMarkup(React.createElement(MdHeatPump)));
