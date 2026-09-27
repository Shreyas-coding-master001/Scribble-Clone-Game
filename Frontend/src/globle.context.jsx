import { createContext, useState } from "react";

export const ScribbleContext = createContext();

function ScribbleContextProvider({children}) {
     const [username, setUsername] = useState("");
     const [roomId, setroomId] = useState("");

    return(
        <ScribbleContext.Provider value={{username: username, setUsername: setUsername, roomId, setroomId}}>
            {children}
        </ScribbleContext.Provider>
    )
}

export default ScribbleContextProvider;


