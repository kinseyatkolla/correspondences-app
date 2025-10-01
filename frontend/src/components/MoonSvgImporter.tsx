import React from "react";
import { View } from "react-native";

// Import all SVG files statically
import Moon1 from "../../assets/images/moons/1.svg";
import Moon2 from "../../assets/images/moons/2.svg";
import Moon3 from "../../assets/images/moons/3.svg";
import Moon4 from "../../assets/images/moons/4.svg";
import Moon5 from "../../assets/images/moons/5.svg";
import Moon6 from "../../assets/images/moons/6.svg";
import Moon7 from "../../assets/images/moons/7.svg";
import Moon8 from "../../assets/images/moons/8.svg";
import Moon9 from "../../assets/images/moons/9.svg";
import Moon10 from "../../assets/images/moons/10.svg";
import Moon11 from "../../assets/images/moons/11.svg";
import Moon12 from "../../assets/images/moons/12.svg";
import Moon13 from "../../assets/images/moons/13.svg";
import Moon14 from "../../assets/images/moons/14.svg";
import Moon15 from "../../assets/images/moons/15.svg";
import Moon16 from "../../assets/images/moons/16.svg";
import Moon17 from "../../assets/images/moons/17.svg";
import Moon18 from "../../assets/images/moons/18.svg";
import Moon19 from "../../assets/images/moons/19.svg";
import Moon20 from "../../assets/images/moons/20.svg";
import Moon21 from "../../assets/images/moons/21.svg";
import Moon22 from "../../assets/images/moons/22.svg";
import Moon23 from "../../assets/images/moons/23.svg";
import Moon24 from "../../assets/images/moons/24.svg";
import Moon25 from "../../assets/images/moons/25.svg";
import Moon26 from "../../assets/images/moons/26.svg";
import Moon27 from "../../assets/images/moons/27.svg";
import Moon28 from "../../assets/images/moons/28.svg";
import Moon29 from "../../assets/images/moons/29.svg";
import Moon30 from "../../assets/images/moons/30.svg";

interface MoonSvgImporterProps {
  svgName: string;
  width?: number;
  height?: number;
  style?: any;
}

// Map SVG names to components
const svgComponents: { [key: string]: React.ComponentType<any> } = {
  "1": Moon1,
  "2": Moon2,
  "3": Moon3,
  "4": Moon4,
  "5": Moon5,
  "6": Moon6,
  "7": Moon7,
  "8": Moon8,
  "9": Moon9,
  "10": Moon10,
  "11": Moon11,
  "12": Moon12,
  "13": Moon13,
  "14": Moon14,
  "15": Moon15,
  "16": Moon16,
  "17": Moon17,
  "18": Moon18,
  "19": Moon19,
  "20": Moon20,
  "21": Moon21,
  "22": Moon22,
  "23": Moon23,
  "24": Moon24,
  "25": Moon25,
  "26": Moon26,
  "27": Moon27,
  "28": Moon28,
  "29": Moon29,
  "30": Moon30,
};

const MoonSvgImporter: React.FC<MoonSvgImporterProps> = ({
  svgName,
  width = 100,
  height = 100,
  style,
}) => {
  const SvgComponent = svgComponents[svgName];

  if (!SvgComponent) {
    console.warn(`SVG component not found for: ${svgName}`);
    return null;
  }

  return (
    <View style={style}>
      <SvgComponent width={width} height={height} />
    </View>
  );
};

export default MoonSvgImporter;
