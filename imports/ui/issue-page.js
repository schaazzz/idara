import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import {Comments} from '../api/comments.js';
import './issue-page.html';

var tabChanged = new ReactiveVar(false);
var nextStateName = new ReactiveVar('');
var currentState = new ReactiveVar(null);
var unblockStateTransition = new ReactiveVar(false);

Template.issuePage.onCreated(function onCreated () {
});

Template.issuePage.onRendered(function onRendered() {
    var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
    var thisProject = Projects.findOne({'name': activeProject.get()});
    var workflow = thisProject.workflow;

    this.$('#chk-state-complete').radiocheck();

    if ((workflow[thisIssue.stateIndex].stateName != 'Open') &&
        (workflow[thisIssue.stateIndex].stateName != 'Closed')) {
        this.$('#div-state-complete').removeClass('hidden');
    } else {
        this.$('#div-state-complete').addClass('hidden');
    }

    tabChanged.set(true);

    this.autorun(function() {
        state = currentState.get();
        if (state.hasParticipants)  {
            $('#tab-' + state.stateName).tab('show');
            tabChanged.set(true);
        }
    });
});

Template.issuePage.helpers({
    allStates() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = [];

        if (thisIssue.stateIndex > 0) {
            workflow = thisProject.workflow;

            if (workflow[thisIssue.stateIndex].stateName == 'Closed') {
                workflow = workflow.slice(1, workflow.length - 1);
            } else {
                workflow = workflow.slice(1, thisIssue.stateIndex + 1);
            }
            workflow[0].isFirst = true;
        }
        return workflow;
    },
    stateTransition() {
        var transition = {prompt: false, nextStateSingle: null, nextStateList: null}
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        var nextState = workflow[thisIssue.stateIndex].nextState;
        if (name != '$none') {
            var transitionMethod = nextState.split(':')[0];
            nextStateName.set(nextState.split(':')[1]);

            if (transitionMethod == '$prompt') {
                transition.prompt = true;
                transition.nextStateSingle = null;
                transition.nextStateList = nextStateName.get().split(',');
            } else {
                transition.prompt = false;
                transition.nextStateList = null;
                transition.nextStateSingle = nextStateName.get();
            }
        }

        return transition;
    },
    isNextStateClosed() {
        return nextStateName.get() == 'Closed';
    },
    disableIssueControls() {
        var result = false;
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});

        if (Meteor.user().username != thisIssue.responsible) {
            result = true;
        }

        return result;
    },
    isClosed() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex].stateName == 'Closed';
    },
    currentState() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        if ((workflow[thisIssue.stateIndex].state != 'Open') &&
            (workflow[thisIssue.stateIndex].state != 'Closed')) {
            $('#div-state-complete').removeClass('hidden');
        } else {
            $('#div-state-complete').addClass('hidden');
        }

        state = workflow[thisIssue.stateIndex];
        currentState.set(state)

        return state;
    },
    issue() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisIssue.startDate = moment(new Date()).format('YYYY-MM-DD');
        return thisIssue;
    },
    comments() {
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        if (tabChanged.get()) {
            tabChanged.set(false);
        }

        tab = $("ul#div-state-tabs li.active").children().attr("id");
        if(tab) {
            tab = tab.split('-')[1];

            var stateIndex = 0;
            for (stateIndex = 0; stateIndex < workflow.length; stateIndex++) {
                if (workflow[stateIndex].stateName == tab) {
                    break;
                }
            }

            var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
            return Comments.find({'project': activeProject.get(), 'issue': parseInt(activeIssue.get()), 'state': stateIndex});
        } else {
            return null;
        }
    },
    blockStateTransition() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        var result = false;
        if ((workflow[thisIssue.stateIndex].stateName != 'Open') &&
            (workflow[thisIssue.stateIndex].stateName != 'Closed') &&
            !unblockStateTransition.get()) {
            result = true;
        }

        return result;
    },
    users() {
        return Meteor.users.find({});
    },
    haveAllParticipantsCommented() {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});

        var result = false;
        for (var i = 0; i < thisIssue.participants[thisIssue.stateIndex].length; i++) {
            usr = thisIssue.participants[thisIssue.stateIndex][i];
            comment = Comments.findOne({'project': activeProject.get(), 'issue': parseInt(activeIssue.get()), state: thisIssue.stateIndex, createdBy: usr});

            if (comment) {
                result = true;
            } else {
                $('#chk-state-complete').radiocheck('uncheck');
                unblockStateTransition.set(false);
                result = false;
                break;
            }
        }

        return result;
    },
    subStateMsg() {
        var msg = '';
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});

        if (thisProject.workflow[thisIssue.stateIndex].stateName == 'Closed') {
            msg = '(' + thisIssue.subStateMsg + ')';
        }

        return msg;
    },
    showComments() {
        var result = false;
        if (currentState.get().hasParticipants || currentState.get().stateName == 'Closed') {
            result = true;
        }

        return result;
    }
});

Template.issuePage.events({
    'click [id=btn-add-comment]'(event, template) {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        Meteor.call('comments.insert', activeProject.get(), parseInt(activeIssue.get()), thisIssue.stateIndex, $('#txt-comment').val());
        $('#txt-comment').val('');
        $('#div-comment').removeClass('in');
    },
    'click [id=btn-next-state]'(event, template) {
        Meteor.call('issues.incrementState', activeProject.get(), parseInt(activeIssue.get()));
    },
    'click [name=btn-next-state]'(event, template) {
        var stateIndex = 0;
        var stateName = event.target.id;
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;
        for (stateIndex = 0; stateIndex < workflow.length; stateIndex++) {
            if (workflow[stateIndex].stateName == stateName) {
                break;
            }
        }

        if (stateName == 'Closed') {
        } else {
            Meteor.call('issues.setState', activeProject.get(), parseInt(activeIssue.get()), stateIndex);
        }
    },
    'click [name=comments-tab]'(event, template) {
        tabChanged.set(true);
    },
    'click [id=btn-add-participant]'(event, template) {
        if ($('#select-responsible').val() != -1) {
            var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
            var thisProject = Projects.findOne({'name': activeProject.get()});

            var participant = $('#select-responsible :selected').text()
            Meteor.call('issues.addParticipant', activeProject.get(), parseInt(activeIssue.get()), thisIssue.stateIndex, participant, function (error, result) {
                if(result) {
                    var historyTxt = '[' + moment(new Date()).format('YYYY-MM-DD, HH:MM') + '] ' + Meteor.user().username + ' added ' + participant + ' as a ' + thisProject.workflow[thisIssue.stateIndex].participantsRole;
                    Meteor.call('issues.addHistory', activeProject.get(), parseInt(activeIssue.get()), historyTxt);
                }
            });
        }
    },
    'change [id=chk-state-complete]'(event, template) {
        if (event.target.checked) {
            unblockStateTransition.set(true);
        } else {
            unblockStateTransition.set(false);
        }
    },
    'click [id=btn-reopen-issue]'(event, template) {
        console.log('Reopen issue!?');
    }
});
