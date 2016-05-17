import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import {Comments} from '../api/comments';
import './issue-page.html';

var tabChanged = new ReactiveVar(false);
var activeTab = new ReactiveVar('');
var nextStateName = new ReactiveVar('');
var currentState = new ReactiveVar(null);
var stateChangeMsg = new ReactiveVar(null);
var newStateChangeMsg = new ReactiveVar(null);
var unblockStateTransition = new ReactiveVar(false);

function findStateByName(stateName) {
    var result = null;
    var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get()), 'project': activeProject.get()});
    var workflow = thisIssue.workflow;

    for (var i = 0; i < workflow.length; i++) {
        if (workflow[i].stateName == stateName) {
            result = workflow[i];
        }
    }

    return (result);
}

Template.issuePage.onCreated(function onCreated () {
});

Template.issuePage.onRendered(function onRendered() {
    var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get()), 'project': activeProject.get()});
    var workflow = thisIssue.workflow;

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

        commentsStateList = []
        comments = Comments.find({'project': activeProject.get(), 'issue': parseInt(activeIssue.get())}).fetch();
        prevState = '';
        for (var i = 0; i < comments.length; i++) {
            var currentState = comments[i].state;
            if ((prevState != currentState) && (commentsStateList.indexOf(currentState) < 0)) {
                commentsStateList.push(currentState);
                prevState = currentState;
            }
        }

        if (thisIssue.stateIndex > 0) {
            workflow = thisProject.workflow;

            if (workflow[thisIssue.stateIndex].stateName == 'Closed') {
                workflow = workflow.slice(1, workflow.length - 1);
            } else if ((commentsStateList.length == 0) || (commentsStateList.indexOf(thisIssue.stateIndex) < 0)) {
                if (workflow[thisIssue.stateIndex].stateName == 'Closed') {
                    workflow = workflow.slice(1, workflow.length - 1);
                } else {
                    workflow = workflow.slice(1, thisIssue.stateIndex + 1);
                }
            } else {
                workflow = workflow.slice(Math.min.apply(null, commentsStateList), Math.max.apply(null, commentsStateList) + 1)
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

            if (transitionMethod == '$select') {
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
        var result = true;
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});

        if (Meteor.user().profile.isRoot
            || (Meteor.user().username == thisProject.admin)
            || (thisProject.pmUsers.indexOf(Meteor.user().username) >= 0)
            || (Meteor.user().username == thisIssue.responsible)) {
            result = false;
        }

        return (result);
    },
    hideStateCheckbox() {
        var result = '';
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        if ((workflow[thisIssue.stateIndex].stateName == 'Closed') || !workflow[thisIssue.stateIndex].hasParticipants) {
            result = 'hidden';
        }

        return (result);
    },
    isClosed() {
        var result = {status: false, miscInfo: ''};
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});
        var workflow = thisProject.workflow;

        if (workflow[thisIssue.stateIndex].stateName == 'Closed') {
            $('#div-state-complete').addClass('hidden');
            result.status = true;
            result.miscInfo = 'hidden';
        }

        return (result);
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

        var tab = $("ul#div-state-tabs li.active").children().attr("id");
        if(tab) {
            tab = tab.split('-')[1];
            activeTab.set(tab);
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
            workflow[thisIssue.stateIndex].hasParticipants &&
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
    stateChangeMsg() {
        return stateChangeMsg.get();
    },
    subStateMsg() {
        var msg = '';
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        var thisProject = Projects.findOne({'name': activeProject.get()});

        if (thisProject.workflow[thisIssue.stateIndex].stateName == 'Closed') {
            msg = '(' + thisIssue.subStateMsg + ')';
        }

        return '';
    },
    showComments() {
        var result = false;
        if ((currentState.get().stateName != 'Open') || ( currentState.get().stateName == 'Closed')) {
            result = true;
        }

        return result;
    },
    allowComments() {
        var thisIssue = Issues.findOne({'project': activeProject.get(), 'number': parseInt(activeIssue.get())});
        var result = false;

        var tab = $("ul#div-state-tabs li.active").children().attr("id");
        var tabStateIndex = 0;
        for (tabStateIndex = 0; tabStateIndex < thisIssue.workflow.length; tabStateIndex++) {
            if (thisIssue.workflow[tabStateIndex].stateName == activeTab.get()) {
                break;
            }
        }

        if((thisIssue.stateIndex == tabStateIndex)
            && (thisIssue.workflow[thisIssue.stateIndex].openComments
                ||  (thisIssue.participants[thisIssue.stateIndex].indexOf(Meteor.user().username) >= 0))) {
            result = true;
        }

        return result;
    },
    startStateHasStateChangeComment(startState) {
        var result = false;
        var state = findStateByName(startState);
        if (state) {
            result = state.hasStateChangeComment;
        }

        return (result);
    }
});

Template.issuePage.events({
    'click [id=btn-add-comment]'(event, template) {
        var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        Meteor.call('comments.insert', activeProject.get(), parseInt(activeIssue.get()), thisIssue.stateIndex, $('#txt-comment').val().replace(/\n/gm, '<br>'));
        $('#txt-comment').val('');
        $('#div-comment').removeClass('in');
    },
    'click [id=btn-next-state]'(event, template) {
        function worker() {
            $('#chk-state-complete').radiocheck('uncheck');
            unblockStateTransition.set(false);
            Meteor.call('issues.incrementState', activeProject.get(), parseInt(activeIssue.get()), newStateChangeMsg.get());
        }

        if (currentState.get().hasStateChangeComment) {
            $('#txt-state-change-msg').val('');
            $('#modal-add-state-change-msg').modal();

            $('#modal-add-state-change-msg').on('hidden.bs.modal', function () {
                worker();
                $('#modal-add-state-change-msg').off();
            });
        } else {
            worker();
        }
    },
    'click [name=btn-next-state]'(event, template) {
        function worker() {
            var stateIndex = 0;
            var stateName = event.target.id;
            var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get()), 'project': activeProject.get()});
            var workflow = thisIssue.workflow;

            for (stateIndex = 0; stateIndex < workflow.length; stateIndex++) {
                if (workflow[stateIndex].stateName == stateName) {
                    break;
                }
            }

            if (stateName == 'Closed') {
                Meteor.call('issues.setState', activeProject.get(), parseInt(activeIssue.get()), stateIndex, newStateChangeMsg.get());
            } else {
                Meteor.call('issues.setState', activeProject.get(), parseInt(activeIssue.get()), stateIndex, newStateChangeMsg.get());
            }
            $('#chk-state-complete').radiocheck('uncheck');
            unblockStateTransition.set(false);
        }

        if (currentState.get().hasStateChangeComment) {
            $('#txt-state-change-msg').val('');
            $('#modal-add-state-change-msg').modal();

            $('#modal-add-state-change-msg').on('hidden.bs.modal', function () {
                worker();
                $('#modal-add-state-change-msg').off();
            });
        } else {
            worker();
        }
    },
    'click [id=btn-reopen-issue]'(event, template) {
        function worker() {
            Meteor.call('issues.setState', activeProject.get(), parseInt(activeIssue.get()), 1, newStateChangeMsg.get());
        }

        if (currentState.get().hasStateChangeComment) {
            $('#txt-state-change-msg').val('');
            $('#modal-add-state-change-msg').modal();

            $('#modal-add-state-change-msg').on('hidden.bs.modal', function () {
                worker();
                $('#modal-add-state-change-msg').off();
            });
        } else {
            worker();
        }
    },
    'click [name=comments-tab]'(event, template) {
        tabChanged.set(true);
    },
    'click [id=btn-add-participant]'(event, template) {
        if ($('#select-participant').val() != -1) {
            var thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
            var thisProject = Projects.findOne({'name': activeProject.get()});

            var participant = $('#select-participant :selected').text()
            Meteor.call('issues.addParticipant', activeProject.get(), parseInt(activeIssue.get()), thisIssue.stateIndex, participant);
        }
    },
    'change [id=chk-state-complete]'(event, template) {
        if (event.target.checked) {
            unblockStateTransition.set(true);
        } else {
            unblockStateTransition.set(false);
        }
    },
    'click [id=a-edit-issue]'(event, template) {
        editIssue.set(true);
        target.set('newIssue');
    },
    'click [name=a-state-change-msg]'(event, template) {
        stateChangeMsg.set(event.target.attributes.value.textContent);
        $('#modal-state-change-msg').modal();
    },
    'keypress [id=txt-state-change-msg]'(event, template) {
        if (event.keyCode == 13) {
            newStateChangeMsg.set(event.target.value);
            $("#modal-add-state-change-msg").modal('toggle');
        }
    }
});
