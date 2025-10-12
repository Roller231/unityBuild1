import React from "react";
import { View } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

interface Props {
  color: string;
}

const ItemList: React.FC<Props> = ({ color }) => {
  return (
    
    <View style={{ flex: 1, alignItems: "center", backgroundColor: color }}>
      {Array.from({ length: 4 }).map((_, index) => {
        return (
          <View
            key={index}
            style={{
              width: "80%",
              height: 120,
              backgroundColor: color,
              marginTop: 12,
              borderRadius: 20,
              opacity: 1 - index * 0.3,
            }}
          />
        );
      })}
    </View>
  );
};

export default ItemList;
