import { useCallback, useEffect, useState, useRef } from 'react'

export const useStateWithCallback = (initialState) => {
    const [state, setState] = useState(initialState);
    const cbRef = useRef();

    const updateState = useCallback((newState, cb) => {
        cb.current = cb;

        setState(prev => 
            typeof newState === 'function' ? newState(prev) : newState
        );
    }, []);

    useEffect(() => {
        if(cbRef.current) {
            cbRef.current(state);
            cbRef.current = null;
        }
    }, [state]);

    return [state, updateState];
}
