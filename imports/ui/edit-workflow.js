import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import './edit-workflow.html';

var jsonEditor = null;

defaultWorkflow =
    `{\"default\": [{
            \"stateName\": \"Open\",
            \"nextState\": \"$fixed:Review\"
        }, {
            \"stateName\":\"Review\",
            \"hasParticipants\": true,
            \"participantsRole\": \"Reviewer\",
            \"nextState\": \"$fixed:Resolution\",
            \"openComments\": true
        }, {
            \"stateName\":\"Resolution\",
            \"hasParticipants\": false,
            \"participantsRole\": null,
            \"nextState\": \"$select:Test,Closed\",
            \"openComments\": false
        }, {
            \"stateName\":\"Test\",
            \"hasParticipants\": true,
            \"participantsRole\": \"Tester\",
            \"nextState\": \"$fixed:Closed\",
            \"openComments\": false
        }, {
            \"stateName\": \"Closed\",
            \"nextState\": \"$none\"
        }]
    }`;

Template.editWorkflow.onCreated(function onCreated() {
});

Template.editWorkflow.onRendered(function onRendered() {
    jsonEditor = CodeMirror.fromTextArea(
        document.getElementById('txt-workflow'),
        {indentUnit: 4, tabSize: 4, indentWithTabs: false, cursorHeight: 0.85});

    $(".CodeMirror").css('font-size','10pt');
    $(".CodeMirror").css('border', '2px solid #1abc9c');
    $(".CodeMirror").css('border-radius', '5px');
    jsonEditor.setValue(defaultWorkflow);
    jsonEditor.setSize('100%', '88%');
});

Template.editWorkflow.events({
    'click [id=btn-parse-workflow]'(event, template) {
        parsedWorkflow = JSON.parse(defaultWorkflow);
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

        var workflowCanvas = document.getElementById('canvas-workflow');
        var workflowCanvasCtx = workflowCanvas.getContext('2d');

        function doMouseDown(e) {
            var i = 0;
            var stateClicked = false;

            for (i = 0; i < parsedWorkflow.default.length; i++) {
                if ((e.offsetX > parsedWorkflow.default[i].rectX)
                    && (e.offsetX < (parsedWorkflow.default[i].rectX + parsedWorkflow.default[i].rectWidth))
                    && (e.offsetY > parsedWorkflow.default[i].rectY)
                    && (e.offsetY < (parsedWorkflow.default[i].rectY + parsedWorkflow.default[i].rectHeight))) {
                        stateClicked = true;
                        break;
                    }
            }

            if (stateClicked && (parsedWorkflow.default[i].stateName != 'Open') && (parsedWorkflow.default[i].stateName != 'Closed')) {
                workflowCanvasCtx.fillStyle = 'rgb(0, 0, 0)';
                roundedRect(workflowCanvasCtx, e.offsetX, e.offsetY, 250, 100, 20, true, true);
                workflowCanvasCtx.fillStyle = 'rgb(255, 255, 255)';
                workflowCanvasCtx.font = '15px Arial';
                workflowCanvasCtx.fillText('hasParticipants: '+ parsedWorkflow.default[i].hasParticipants, e.offsetX + 25, e.offsetY + 25);
                workflowCanvasCtx.fillText('participantsRole: '+ parsedWorkflow.default[i].participantsRole, e.offsetX + 25, e.offsetY + 45);
                workflowCanvasCtx.fillText('nextState: '+ parsedWorkflow.default[i].nextState, e.offsetX + 25, e.offsetY + 65);
                workflowCanvasCtx.fillText('openComments: '+ parsedWorkflow.default[i].openComments, e.offsetX + 25, e.offsetY + 85);
                workflowCanvasCtx.stroke();
            }
        }

        function doMouseUp(e) {
            workflowCanvasCtx.clearRect(0, 0, workflowCanvas.width, workflowCanvas.height);
            redraw();
        }

        function getStateIndex(stateName) {
            var i = 0;
            for (i = 0; i < parsedWorkflow.default.length; i++) {
                if (parsedWorkflow.default[i].stateName == stateName) {
                    break;
                }
            }
            return i;
        }

        function redraw() {
            workflowCanvas.addEventListener('mousedown', doMouseDown, false);
            workflowCanvas.addEventListener('mouseup', doMouseUp, false);
            workflowCanvasCtx.strokeStyle = 'rgb(50, 50, 0)';
            workflowCanvasCtx.fillStyle = 'rgb(255, 0, 0)';

            for (var i = 0; i < parsedWorkflow.default.length; i++) {
                roundedRect(workflowCanvasCtx, 10, 20 + (i * 175), 150, 100, 20, false, true);
                workflowCanvasCtx.font = '20px Georgia';
                workflowCanvasCtx.fillText(parsedWorkflow.default[i].stateName, 25, 40 + (i * 175) + 15);
                workflowCanvasCtx.lineWidth = 2;
                parsedWorkflow.default[i].rectX = 10;
                parsedWorkflow.default[i].rectY = 20 + (i * 175);
                parsedWorkflow.default[i].rectWidth = 150;
                parsedWorkflow.default[i].rectHeight = 100;

                var nextState = parsedWorkflow.default[i].nextState;
                var transition = nextState.split(':')[0];
                nextState = nextState.split(':')[1];

                if (transition == '$fixed') {
                    parsedWorkflow.default[i].singleNextState = getStateIndex(nextState);
                }

                if (transition == '$select') {
                    parsedWorkflow.default[i].multipleNextStates = [];
                    nextState = nextState.replace(' ', '').split(',');
                    for (var j = 0; j < nextState.length; j++) {
                        parsedWorkflow.default[i].multipleNextStates.push(getStateIndex(nextState[j]));
                    }
                }
            }

            for (var i = 0; i < parsedWorkflow.default.length; i++) {
                var x0 = parsedWorkflow.default[i].rectX + (parsedWorkflow.default[i].rectWidth / 2);
                var y0 = parsedWorkflow.default[i].rectY + parsedWorkflow.default[i].rectHeight;

                if ((i + 1) < parsedWorkflow.default.length) {
                    var y1 = parsedWorkflow.default[i + 1].rectY;
                    workflowCanvasCtx.moveTo(x0, y0);
                    workflowCanvasCtx.lineTo(x0, y1);
                    workflowCanvasCtx.stroke();
                }

                if (parsedWorkflow.default[i].multipleNextStates) {
                    for (var j = 1; j < parsedWorkflow.default[i].multipleNextStates.length; j++) {
                        k = parsedWorkflow.default[i].multipleNextStates[j];
                        var xN = parsedWorkflow.default[i].rectX + parsedWorkflow.default[i].rectWidth;
                        var yN = parsedWorkflow.default[i].rectY + (parsedWorkflow.default[i].rectHeight / 2);

                        workflowCanvasCtx.moveTo(xN, yN);
                        workflowCanvasCtx.lineTo(xN + 75, yN);
                        workflowCanvasCtx.moveTo(xN + 75, yN);

                        yN = parsedWorkflow.default[k].rectY + (parsedWorkflow.default[k].rectHeight / 2);

                        workflowCanvasCtx.lineTo(xN + 75, yN);

                        workflowCanvasCtx.moveTo(xN + 75, yN);
                        workflowCanvasCtx.lineTo(xN, yN);
                        workflowCanvasCtx.stroke();
                    }
                }
            }
            //
            // xX = parsedWorkflow.default[2].rectX + parsedWorkflow.default[2].rectWidth;
            // yY = parsedWorkflow.default[2].rectY + (parsedWorkflow.default[2].rectHeight / 2);
            // workflowCanvasCtx.moveTo(xX, yY);
            // workflowCanvasCtx.lineTo(xX + 75, yY);
            // workflowCanvasCtx.moveTo(xX + 75, yY);
            //
            // yY = parsedWorkflow.default[4].rectY + (parsedWorkflow.default[4].rectHeight / 2);
            //
            // workflowCanvasCtx.lineTo(xX + 75, yY);
            //
            // workflowCanvasCtx.moveTo(xX + 75, yY);
            // workflowCanvasCtx.lineTo(xX, yY);
            // workflowCanvasCtx.stroke();
        }

        redraw();
    }
});
