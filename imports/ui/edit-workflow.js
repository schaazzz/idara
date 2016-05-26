import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { Workflows } from '../api/workflows';
import './edit-workflow.html';

var jsonEditor = null;
var overallArcIndex = 1;
var thisWorkflow = null;
var thisWorkflowSavedId = null;
var workflowName = new ReactiveVar(null);
var parsingResult = new ReactiveVar({true, null});
var newStateTemplate = {
    "name": "<workflow_name>",
    "states": [{
        "stateName": "Open",
        "nextState": "$fixed:<your_next_state_here>"
    }, {
        "stateName": "<insert_new_state_here>"
    }, {
        "stateName": "Closed",
        "nextState": "$none"
    }]
};

function getStateIndex(states, stateName) {
    var i = 0;
    for (i = 0; i < states.length; i++) {
        if (states[i].stateName == stateName) {
            break;
        }
    }
    return i;
}

function parseNextState(states, index) {
    var result  = {};

    nextState = states[index].nextState;
    transition = nextState.split(':')[0];
    nextState = nextState.split(':')[1];
    if (transition == '$fixed') {
        result.singleNextState = getStateIndex(states, nextState);
    } else if (transition == '$select') {
        var nextState = nextState.replace(new RegExp(' ', 'g'), '').split(',');
        var nextStateList = []
        for (var i = 0; i < nextState.length; i++) {
            nextStateList.push(getStateIndex(states, nextState[i]));
        }
        nextStateList.sort(function (a, b) { return (a-b); });
        result.multipleNextStates = nextStateList;
    }

    return result;
}

function checkWorkflow(workflow) {
    result = {pass: true, msg: null};
    try {
        workflow = JSON.parse(jsonEditor.getValue());
    } catch (error) {
        result.pass = false;
        result.msg = 'Invalid JSON!';
    }

    if (workflow.states[0].stateName != 'Open') {
        result.pass = false;
        result.msg = 'First state is not \"Open\"!';
    }

    if (workflow.states[workflow.states.length - 1].stateName != 'Closed') {
        result.pass = false;
        result.msg = 'Last state is not \"Closed\"!';
    }

    var nextState = parseNextState(workflow.states, 0);
    if (nextState.singleNextState != 1) {
        result.pass = false;
        result.msg = 'The \"Open\" state must be directly connected to the next adjacent node!';
    }

    nextState = parseNextState(workflow.states, (workflow.states.length - 2));
    if (nextState.singleNextState) {
        if (nextState.singleNextState != (workflow.states.length - 1)) {
            result.pass = false;
            result.msg = 'The \"Closed\" state must be directly connected to the previous adjacent node!';
        }
    }

    if (nextState.multipleNextStates) {
        if (nextState.multipleNextStates.indexOf(workflow.states.length - 1) < 0) {
            result.pass = false;
            result.msg = 'The \"Closed\" state must be directly connected to the previous adjacent node!';
        }
    }

    if (workflow.states.length < 3) {
        result.pass = false;
        result.msg = 'You need to define atleast one \"working\" state!';
    }

    return result;
}

Template.editWorkflow.onCreated(function onCreated() {
    if (newWorkflow.get()) {
        thisWorkflow = newStateTemplate;
    } else {
        thisWorkflow = Workflows.findOne({'name': activeWorkflow.get()}, {'_id': 0});
        thisWorkflowSavedId = thisWorkflow._id;
        workflowName.set(thisWorkflow.name);
        delete thisWorkflow._id;
    }
});

Template.editWorkflow.onRendered(function onRendered() {
    jsonEditor = CodeMirror.fromTextArea(
        document.getElementById('txt-workflow'),
        {indentUnit: 4, tabSize: 4, indentWithTabs: false, mode: {name: "javascript", json: true}, cursorHeight: 0.85});

    $(".CodeMirror").css('font-size','10pt');
    $(".CodeMirror").css('border', '2px solid #1abc9c');
    $(".CodeMirror").css('border-radius', '5px');

    if (newWorkflow.get()) {
        jsonEditor.setValue(JSON.stringify(newStateTemplate, null, 4));
    } else {
        jsonEditor.setValue(JSON.stringify(thisWorkflow, null, 4));
    }

    jsonEditor.setSize('100%', '350');
});

Template.editWorkflow.helpers({
    workflowName() {
        return workflowName.get();
    },
    workflowParsing() {
        return parsingResult.get();
    }
});

Template.editWorkflow.events({
    'click [id=btn-save-workflow]'(event, template) {
        var workflow = JSON.parse(jsonEditor.getValue());
        checkWorkflow(workflow);
        if (newWorkflow.get()) {
            Meteor.call('workflows.insert', workflow);
        } else {
            Meteor.call('workflows.update', thisWorkflowSavedId, workflow);
        }
    },
    'click [id=btn-parse-workflow]'(event, template) {
        var workflow = JSON.parse(jsonEditor.getValue());
        workflowName.set(workflow.name);

        $('#modal-workflow').modal();

        var workflowCanvas = document.getElementById('canvas-workflow');
        var workflowCanvasCtx = workflowCanvas.getContext('2d');
        workflowCanvasCtx.clearRect(0, 0, workflowCanvas.width, workflowCanvas.height);
        workflowCanvas.height = 50;

        function roundedRect(ctx, x, y, width, height, radius, fill, stroke)
        {
            ctx.save();
            ctx.beginPath();

            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + width, y, x + width, y + radius,radius);

            ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);

            ctx.arcTo(x, y + height, x, y + height - radius, radius);

            ctx.arcTo(x, y, x + radius, y, radius);

            if (fill) {
        	    ctx.fill();
            }

            if (stroke) {
        	    ctx.stroke();
            }

            ctx.restore();
        }

        function doMouseDown(e) {
            var i = 0;
            var stateClicked = false;

            for (i = 0; i < workflow.states.length; i++) {
                if ((e.offsetX > workflow.states[i].rectX)
                    && (e.offsetX < (workflow.states[i].rectX + workflow.states[i].rectWidth))
                    && (e.offsetY > workflow.states[i].rectY)
                    && (e.offsetY < (workflow.states[i].rectY + workflow.states[i].rectHeight))) {
                        stateClicked = true;
                        break;
                    }
            }

            if (stateClicked && (workflow.states[i].stateName != 'Open') && (workflow.states[i].stateName != 'Closed')) {
                var txtArray = [];
                var maxWidth = 0;

                txtArray.push('hasParticipants: '+ workflow.states[i].hasParticipants);
                txtArray.push('participantsRole: '+ workflow.states[i].participantsRole);
                txtArray.push('nextState: '+ workflow.states[i].nextState);
                txtArray.push('openComments: '+ workflow.states[i].openComments);

                workflowCanvasCtx.font = '15px Arial';

                for (var i = 0; i < txtArray.length; i++) {
                    textWidth = workflowCanvasCtx.measureText(txtArray[i]).width;

                    if (textWidth > maxWidth) {
                        maxWidth = textWidth;
                    }
                }
                workflowCanvasCtx.fillStyle = 'rgb(0, 0, 0)';
                roundedRect(workflowCanvasCtx, e.offsetX, e.offsetY, maxWidth + 30, 100, 20, true, true);

                workflowCanvasCtx.fillStyle = 'rgb(255, 255, 255)';
                for (var i = 0; i < txtArray.length;i++) {
                    workflowCanvasCtx.fillText(txtArray[i], e.offsetX + 15, e.offsetY + (25 + (i * 20)));
                }

                workflowCanvasCtx.stroke();
            }
        }

        function doMouseUp(e) {
            workflowCanvasCtx.clearRect(0, 0, workflowCanvas.width, workflowCanvas.height);
            redraw();
        }

        function connectStates(index) {
            function indirectConnection(i, j) {
                if (workflow.states[i].numIndirectConnections) {
                    workflow.states[i].numIndirectConnections++
                } else {
                    workflow.states[i].numIndirectConnections = 1;
                }

                if (workflow.states[j].numIndirectConnections) {
                    workflow.states[j].numIndirectConnections++
                } else {
                    workflow.states[j].numIndirectConnections = 1;
                }

                var xN = workflow.states[i].rectX + workflow.states[i].rectWidth;
                var yN = workflow.states[i].rectY + ((workflow.states[i].rectHeight) / (1 + workflow.states[i].numIndirectConnections));

                workflowCanvasCtx.moveTo(xN, yN);
                workflowCanvasCtx.lineTo(xN + (25 * overallArcIndex), yN);

                workflowCanvasCtx.moveTo(xN + (25 * overallArcIndex), yN);
                yN = workflow.states[j].rectY + ((workflow.states[j].rectHeight) / (1 + workflow.states[j].numIndirectConnections));
                workflowCanvasCtx.lineTo(xN + (25 * overallArcIndex), yN);

                workflowCanvasCtx.moveTo(xN + (25 * overallArcIndex), yN);
                workflowCanvasCtx.lineTo(xN, yN);

                workflowCanvasCtx.moveTo(xN, yN);
                workflowCanvasCtx.lineTo(xN + 10, yN - 5);

                workflowCanvasCtx.moveTo(xN, yN);
                workflowCanvasCtx.lineTo(xN + 10, yN + 5);

                workflowCanvasCtx.stroke();
                overallArcIndex++;
            }

            function directConnection(index) {
                var x0 = workflow.states[index].rectX + (workflow.states[index].rectWidth / 2);
                var y0 = workflow.states[index].rectY + workflow.states[index].rectHeight;
                var y1 = workflow.states[index + 1].rectY;

                /* Draw the line between the adjacent nodes */
                workflowCanvasCtx.moveTo(x0, y0);
                workflowCanvasCtx.lineTo(x0, y1);

                /* Draw arrowhead */
                workflowCanvasCtx.moveTo(x0, y1);
                workflowCanvasCtx.lineTo(x0 - 5, y1 - 10);

                workflowCanvasCtx.moveTo(x0, y1);
                workflowCanvasCtx.lineTo(x0 + 5, y1 - 10);

                /* Aaannddd... wait for iiiit... STROKE! */
                workflowCanvasCtx.stroke();
            }

            if (workflow.states[index].singleNextState) {
                if(workflow.states[index].singleNextState == (index + 1)) {
                    directConnection(index);
                } else {
                    indirectConnection(index, workflow.states[index].singleNextState);
                }
            }

            if (workflow.states[index].multipleNextStates) {
                var statesArray = workflow.states[index].multipleNextStates;
                for (var i = 0; i < statesArray.length; i++) {
                    if (statesArray[i] == index + 1) {
                        directConnection(index);
                    } else {
                        indirectConnection(index, statesArray[i]);
                    }
                }
            }
        }

        function redraw() {
            parsingResult.set(checkWorkflow(workflow));

            if(!parsingResult.get().pass) {
                return;
            }

            workflowCanvas.height = workflow.states.length * 100;

            overallArcIndex = 1;
            workflowCanvas.addEventListener('mousedown', doMouseDown, false);
            workflowCanvas.addEventListener('mouseup', doMouseUp, false);
            workflowCanvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            workflowCanvasCtx.fillStyle = 'rgb(255, 0, 0)';

            for (var i = 0; i < workflow.states.length; i++) {
                roundedRect(workflowCanvasCtx, 100, 20 + (i * 90), 250, 65, 10, false, true);
                workflowCanvasCtx.font = '20px Georgia';
                workflowCanvasCtx.fillText(workflow.states[i].stateName, 130, 20 + (i * 90) + 25);
                workflowCanvasCtx.lineWidth = 2;
                workflow.states[i].rectX = 100;
                workflow.states[i].rectY = 20 + (i * 90);
                workflow.states[i].rectWidth = 250;
                workflow.states[i].rectHeight = 65;

                if (workflow.states[i].numIndirectConnections) {
                    workflow.states[i].numIndirectConnections = 0;
                }

                var nextState = workflow.states[i].nextState;
                var transition = nextState.split(':')[0];
                nextState = nextState.split(':')[1];

                if (transition == '$fixed') {
                    workflow.states[i].singleNextState = getStateIndex(workflow.states, nextState);
                }

                if (transition == '$select') {
                    workflow.states[i].multipleNextStates = [];
                    nextState = nextState.replace(' ', '').split(',');
                    for (var j = 0; j < nextState.length; j++) {
                        workflow.states[i].multipleNextStates.push(getStateIndex(workflow.states, nextState[j]));
                    }

                    workflow.states[i].multipleNextStates.sort();
                }
            }

            for (var i = 0; i < workflow.states.length; i++) {
                connectStates(i);
            }
        }

        redraw();
    }
});
