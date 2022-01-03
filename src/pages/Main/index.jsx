import { useEffect, useState } from 'react'
import socket from '../../socket'
import ACTIONS from '../../socket/actions';
import {useHistory} from 'react-router';
import { v4 } from 'uuid';

export default function Main() {
    const history = useHistory();
    const [rooms, updateRooms] = useState([]);

    useEffect(() => {
        socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []} = {}) => {
            updateRooms(rooms)
        })
    }, [])

    return (
        <div>
           <h1>Available Rooms</h1>
           <ul>
               {rooms.map(roomId => (
                   <li key={roomId}>
                       {roomId}
                       <button onClick={() => {
                           history.push(`/room/${roomId}`)
                       }}>JOIN ROOM</button>
                   </li>
               ))}
           </ul>
           <button onClick={() => {
               history.push(`/room/${v4()}`)
           }}>Create new room</button>
        </div>
    )
}