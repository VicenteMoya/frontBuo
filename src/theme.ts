import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
            main: "#800020", // Granate / vino oscuro
        },
        secondary: {
            main: "#ceab00", // Otro tono de rojo oscuro, opcional
        },
        info: {
            main: "#d3f6db",
        }
    },
});

export default theme;
