import { useContext } from "react";
import { ScribbleContext } from "../globle.context";

function useGlobalContext() {
    const context = useContext(ScribbleContext);

    return context;
}

export default useGlobalContext;