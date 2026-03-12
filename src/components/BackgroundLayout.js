import { ImageBackground, StyleSheet } from 'react-native';

export default function BackgroundLayout({ children, style }) {
    return (
        <ImageBackground
            source={require("../../assets/dsu.png")}
            style={[styles.container, style]}
            imageStyle={{ opacity: 0.3 }}
            resizeMode="cover"
        >
            {children}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
