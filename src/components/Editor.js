import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror'; // for autocomplete parentheses and coloring
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);
    useEffect(() => {
        async function init() {  // enable the user of catch block of code sequentially and run code concurrenctly
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: "javascript", json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                    autocorrect: true,
                }
            );

            editorRef.current.on('change', (instance, changes) => { // Attach event listener to editorRef for 'change' event
                const { origin } = changes; // Extract 'origin' property from 'changes' object
                const code = instance.getValue(); // Get current value of editor content
                onCodeChange(code); // Call onCodeChange function with new code value
                if (origin !== 'setValue') { // If change did not originate from 'setValue' method
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, { // Emit 'CODE_CHANGE' event over socket connection
                        roomId,
                        code,
                    });
                }
            });
            
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {   // If socket connection exists
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {    // Listen for 'CODE_CHANGE' event
                if (code !== null) {    // If received code is not null
                    editorRef.current.setValue(code);   // Update the CodeMirror instance with the new code
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    return (
            <textarea id="realtimeEditor"></textarea>
    );
};

export default Editor;
