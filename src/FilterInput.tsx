import * as React  from 'react';
import * as _  from "lodash";
import FilterQueryParser from "./FilterQueryParser";
import BaseAutoCompleteHandler from "./BaseAutoCompleteHandler";
// import ReactCodeMirror from "react-codemirror";
var ReactCodeMirror:any = (require("react-codemirror2") as any).UnControlled;
import "codemirror/addon/hint/show-hint";

import * as CodeMirror from "codemirror";
import "./FilterMode"

import 'codemirror/lib/codemirror.css';
// import 'codemirror/theme/monokai.css';
import "codemirror/addon/hint/show-hint.css";

import grammarUtils from "./GrammarUtils";
import {HintResult,HintFunc,HintOptions,ExtendedCodeMirror,Completion} from "./models/ExtendedCodeMirror";
import AutoCompletePopup from "./AutoCompletePopup";

export default class FilterInput extends React.Component<any,any> {

    options:CodeMirror.EditorConfiguration;
    
    codeMirror:ExtendedCodeMirror;
    doc: CodeMirror.Doc;
    autoCompletePopup:AutoCompletePopup;
    
    public static defaultProps: any = {
        onBlur: ()=>{},
        onFocus: ()=>{},
        additionalCodeMirrorOptions: {},
    };

    constructor(props:any) {
        super(props);

        this.options = {
            // lineNumbers: true,
            mode: "filter-mode",
        }
    }

    findLastSeparatorPositionWithEditor(){
        var doc =  this.codeMirror.getDoc();
        var currentCursor = doc.getCursor();
        var text = doc.getRange({ line: 0, ch: 0 }, currentCursor);
        var index = grammarUtils.findLastSeparatorIndex(text);
        return {
            line: currentCursor.line,
            ch: currentCursor.ch - (text.length - index) + 1
        }
    }


    handlePressingSpace() {
        this.autoCompletePopup.show();
    }

    handlePressingAnyCharacter() {
        if (this.props.additionalCodeMirrorOptions &&
          (this.props.additionalCodeMirrorOptions.readOnly === true ||
            this.props.additionalCodeMirrorOptions.readOnly === 'nocursor')
        ) {
            return;
        }

        if (this.autoCompletePopup.completionShow) {
            return;
        }

        this.autoCompletePopup.show();
    }

    onSubmit(text:string) {
        if (this.props.onSubmit) {
            this.props.onSubmit(text);
        }
    }

    getLastCharacter(){
         var cursor = this.doc.getCursor();
         if(cursor.ch ==0 ) return "";
         return this.doc.getRange({line:cursor.line,ch:cursor.ch-1}, cursor);
    }
    codeMirrorRef(ref:{editor:ExtendedCodeMirror}) {
        if (ref == null) return;
        if (this.codeMirror == ref.editor) {
            return;
        }

        this.codeMirror = ref.editor;
        this.doc = this.codeMirror.getDoc();   
        this.autoCompletePopup = new AutoCompletePopup(this.codeMirror,(text)=>{
            return this.props.needAutoCompleteValues(this.codeMirror, text);
        })

        this.autoCompletePopup.customRenderCompletionItem = this.props.customRenderCompletionItem;
        this.autoCompletePopup.pick = this.props.autoCompletePick;

        this.codeMirror.on("beforeChange", function (instance, change) {
            // remove ALL \n and \t
            var newtext = change.text.join("").replace(/\n|\t/g, "");
            change.update(change.from, change.to, [newtext] as any);
            return true;
        });

        this.codeMirror.on("changes", ()=>{
            this.handlePressingAnyCharacter();
        })

        this.codeMirror.on("focus", (cm,e?)=>{
            this.handlePressingAnyCharacter();
            this.props.onFocus(e);
        })

        this.codeMirror.on("blur", (cm,e?)=>{
            this.onSubmit(this.doc.getValue());
            this.props.onBlur(e)
        })

        this.codeMirror.on("keyup", (cm:ExtendedCodeMirror,e?:KeyboardEvent) => {
            if (e.keyCode == 13) {
                // console.log("enter" + Math.random());
                this.onSubmit(this.doc.getValue());                
            }
        })
    }

    render() {
        return (
                <ReactCodeMirror
                    ref={this.codeMirrorRef.bind(this) }
                    onChange={this.props.onChange}
                    options={{...this.options, ...this.props.additionalCodeMirrorOptions}}  value={this.props.value}/>

        );
    }
}
