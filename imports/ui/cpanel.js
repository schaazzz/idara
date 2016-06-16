import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { Workflows } from '../api/workflows';
import './cpanel.html';

var defaultWorkflow =
`{
    \"name\": \"default\",
    \"states\": [{
        \"stateName\": \"Open\",
        \"nextState\": \"$fixed:Review\"
    }, {
        \"stateName\":\"Review\",
        \"hasParticipants\": true,
        \"participantsRole\": \"Reviewer\",
        \"nextState\": \"$select:Resolution,Closed\",
        \"openComments\": true
    }, {
        \"stateName\":\"Resolution\",
        \"hasParticipants\": false,
        \"participantsRole\": null,
        \"nextState\": \"$fixed:Test\",
        \"openComments\": false
    }, {
        \"stateName\":\"Test\",
        \"hasParticipants\": true,
        \"participantsRole\": \"Tester\",
        \"nextState\": \"$select:Review,Closed\",
        \"openComments\": false
    }, {
        \"stateName\": \"Closed\",
        \"nextState\": "$none"
    }]
}`;

Template.controlPanel.onCreated(function onCreated() {
    activeProject.set(void 0);
    if (Workflows.findOne({'name': 'default'})) {
    } else {
        Meteor.call('workflows.insert', JSON.parse(defaultWorkflow));
    }
});

Template.controlPanel.onRendered(function onRendered() {
    this.$('#switch-toggle-root').bootstrapSwitch();

    onShow = function(event) {
        $('#' + event.target.id).prev('div.panel-heading').find('a.accordion-toggle > span').removeClass('glyphicon-menu-right').addClass('glyphicon-menu-down');
    };

    onHide = function(event) {
        $('#' + event.target.id).prev('div.panel-heading').find('a.accordion-toggle > span').removeClass('glyphicon-menu-down').addClass('glyphicon-menu-right');
    };

    this.$('#collapse-add-user').on('show.bs.collapse', onShow);
    this.$('#collapse-add-user').on('hide.bs.collapse', onHide);

    this.$('#collapse-add-project').on('show.bs.collapse', onShow);
    this.$('#collapse-add-project').on('hide.bs.collapse', onHide);

    this.$('#collapse-add-workflow').on('show.bs.collapse', onShow);
    this.$('#collapse-add-workflow').on('hide.bs.collapse', onHide);
});

Template.controlPanel.helpers({
    workflows() {
        return Workflows.find({});
    },
    users() {
        return Meteor.users.find({});
    },
    isRoot() {
        return Meteor.user().profile.isRoot;
    }
});

Template.controlPanel.events({
    'click [id=btn-add-user]'(event, template) {
        const username = $('#input-username').val();
        const password = $('#input-password').val();
        const isRoot = $('#switch-toggle-root').is(':checked');
        Accounts.createUser({username: username, password: password, profile: {isRoot: isRoot}});
    },
    'click [id=btn-add-project]'(event, template) {
        const projectName = $('#input-projname').val();
        const projectDescription = $('#txt-projdesc').val();
        const projectAdmin = $('#select-admin').val();
        const projectWorkflow = $('#select-workflow').val();

        Meteor.call('projects.insert', projectName, projectDescription, projectAdmin, projectWorkflow);

        $('#input-projname').val('');
        $('#txt-projdesc').val('');
        $('#select-admin').val('-1');
        $('#select-workflow').val('-1');
    },
    'click [id=a-workflow-add]'(event, template) {
        newWorkflow.set(true);
        activeWorkflow.set(null);
        target.set('editWorkflow');
    },
    'click [name=a-workflow-edit]'(event, template) {
        newWorkflow.set(false);
        activeWorkflow.set(event.target.id);
        target.set('editWorkflow');
    }
});
