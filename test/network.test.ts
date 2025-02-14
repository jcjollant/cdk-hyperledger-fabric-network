// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import * as cdk from 'aws-cdk-lib';
import * as assertions from 'aws-cdk-lib/assertions';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

import * as hyperledger from '../src';


const DEFAULT_ENV = { env: { region: 'us-east-1' } };

const TOKEN_REGEXP = /^\$\{Token\[TOKEN\.[0-9]+\]\}$/;


describe('HyperledgerFabricNetwork', () => {

  test('Create a network with default values', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
    const network = new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
      networkName: 'TestNetwork',
      memberName: 'TestMember',
    });
    const template = assertions.Template.fromStack(stack);
    template.resourceCountIs('AWS::ManagedBlockchain::Member', 1);
    template.hasResource('AWS::ManagedBlockchain::Member', {
      Properties: {
        NetworkConfiguration: {
          Name: 'TestNetwork',
          Description: 'TestNetwork',
          Framework: 'HYPERLEDGER_FABRIC',
          FrameworkVersion: '1.4',
          NetworkFrameworkConfiguration: {
            NetworkFabricConfiguration: {
              Edition: 'STANDARD',
            },
          },
          VotingPolicy: {
            ApprovalThresholdPolicy: {
              ProposalDurationInHours: 24,
              ThresholdPercentage: 50,
              ThresholdComparator: 'GREATER_THAN',
            },
          },
        },
        MemberConfiguration: {
          Name: 'TestMember',
          Description: 'TestMember',
        },
      },
    });
    expect(network.networkName).toBe('TestNetwork');
    expect(network.networkDescription).toBe('TestNetwork');
    expect(network.networkId).toMatch(TOKEN_REGEXP);
    expect(network.memberName).toBe('TestMember');
    expect(network.memberDescription).toBe('TestMember');
    expect(network.networkId).toMatch(TOKEN_REGEXP);
    expect(network.frameworkVersion).toBe(hyperledger.FrameworkVersion.VERSION_1_4);
    expect(network.networkEdition).toBe(hyperledger.NetworkEdition.STANDARD);
    expect(network.proposalDurationInHours).toBe(24);
    expect(network.thresholdPercentage).toBe(50);
    expect(network.thresholdComparator).toBe(hyperledger.ThresholdComparator.GREATER_THAN);
    expect(network.vpcEndpointServiceName).toMatch(TOKEN_REGEXP);
    expect(network.ordererEndpoint).toMatch(TOKEN_REGEXP);
    expect(network.caEndpoint).toMatch(TOKEN_REGEXP);
    expect(network.adminPasswordSecret).toBeInstanceOf(secretsmanager.Secret);
    expect(network.adminPrivateKeySecret).toBeInstanceOf(secretsmanager.Secret);
    expect(network.adminSignedCertSecret).toBeInstanceOf(secretsmanager.Secret);
    expect(network.enableCaLogging).toBe(true);
  });

  test('Create a network with custom descriptions', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
    const network = new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
      networkName: 'TestNetwork',
      networkDescription: 'This is a test network',
      memberName: 'TestMember',
      memberDescription: 'This is a test member',
    });
    const template = assertions.Template.fromStack(stack);
    template.hasResource('AWS::ManagedBlockchain::Member', {
      Properties: {
        NetworkConfiguration: {
          Description: 'This is a test network',
        },
        MemberConfiguration: {
          Description: 'This is a test member',
        },
      },
    });
    expect(network.networkDescription).toBe('This is a test network');
    expect(network.memberDescription).toBe('This is a test member');
  });

  test('Create a network with a custom voting policy', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
    const network = new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
      networkName: 'TestNetwork',
      memberName: 'TestMember',
      proposalDurationInHours: 12,
      thresholdPercentage: 75,
      thresholdComparator: hyperledger.ThresholdComparator.GREATER_THAN_OR_EQUAL_TO,
    });
    const template = assertions.Template.fromStack(stack);
    template.hasResource('AWS::ManagedBlockchain::Member', {
      Properties: {
        NetworkConfiguration: {
          VotingPolicy: {
            ApprovalThresholdPolicy: {
              ProposalDurationInHours: 12,
              ThresholdPercentage: 75,
              ThresholdComparator: 'GREATER_THAN_OR_EQUAL_TO',
            },
          },
        },
      },
    });
    expect(network.proposalDurationInHours).toBe(12);
    expect(network.thresholdPercentage).toBe(75);
    expect(network.thresholdComparator).toBe(hyperledger.ThresholdComparator.GREATER_THAN_OR_EQUAL_TO);
  });

  test('Create a starter edition network', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
    const network = new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
      networkEdition: hyperledger.NetworkEdition.STARTER,
      networkName: 'TestNetwork',
      memberName: 'TestMember',
    });
    const template = assertions.Template.fromStack(stack);
    template.hasResource('AWS::ManagedBlockchain::Member', {
      Properties: {
        NetworkConfiguration: {
          NetworkFrameworkConfiguration: {
            NetworkFabricConfiguration: {
              Edition: 'STARTER',
            },
          },
        },
      },
    });
    expect(network.networkEdition).toBe(hyperledger.NetworkEdition.STARTER);
  });

  test('Create a network with framework version 1.2', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
    const network = new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
      networkName: 'TestNetwork',
      memberName: 'TestMember',
      frameworkVersion: hyperledger.FrameworkVersion.VERSION_1_2,
    });
    const template = assertions.Template.fromStack(stack);
    template.hasResource('AWS::ManagedBlockchain::Member', {
      Properties: {
        NetworkConfiguration: {
          FrameworkVersion: '1.2',
        },
      },
    });
    expect(network.frameworkVersion).toBe(hyperledger.FrameworkVersion.VERSION_1_2);
  });

  test('Fail to create a network in an unsupported region', () => {
    expect(hyperledger.SUPPORTED_REGIONS).not.toContain('us-west-1');
    const unsupportedRegion = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', { env: { region: 'us-west-1' } });
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
      });
    };
    expect(unsupportedRegion).toThrow(Error);
  });

  test('Fail to create a network with invalid network name', () => {
    const nameTooShort = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: '',
        memberName: 'TestMember',
      });
    };
    const nameTooLong = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'ThisNetworkNameIsSixtyFiveCharactersLongAndThatIsTooLongToWork123',
        memberName: 'TestMember',
      });
    };
    expect(nameTooShort).toThrow(Error);
    expect(nameTooLong).toThrow(Error);
  });

  test('Fail to create a network with invalid network description', () => {
    const descriptionTooLong = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        networkDescription: 'ThisNetworkDescriptionIsOneHundredTwentyNineCharactersLongAndThatIsTooLongToWork1234567890123456789012345678901234567890123456789',
        memberName: 'TestMember',
      });
    };
    expect(descriptionTooLong).toThrow(Error);
  });

  test('Fail to create a network with invalid member name', () => {
    const nameTooShort = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: '',
      });
    };
    const nameTooLong = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'ThisMemberNameIsSixtyFiveCharactersLongAndThatIsTooLongToWork1234',
      });
    };
    const nameStartsWithNumber = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: '0TestMember',
      });
    };
    const nameStartsAndEndsWithHyphen = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: '-TestMember-',
      });
    };
    const nameHasConsecutiveHyphens = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'Test--Member',
      });
    };
    expect(nameTooShort).toThrow(Error);
    expect(nameTooLong).toThrow(Error);
    expect(nameStartsWithNumber).toThrow(Error);
    expect(nameStartsAndEndsWithHyphen).toThrow(Error);
    expect(nameHasConsecutiveHyphens).toThrow(Error);
  });

  test('Fail to create a network with invalid member description', () => {
    const descriptionTooLong = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
        memberDescription: 'ThisMemberDescriptionIsOneHundredTwentyNineCharactersLongAndThatIsTooLongToWork12345678901234567890123456789012345678901234567890',
      });
    };
    expect(descriptionTooLong).toThrow(Error);
  });

  test('Fail to create a network with an invalid voting policy proposal duration', () => {
    const durationTooShort = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
        proposalDurationInHours: 0,
      });
    };
    const durationTooLong = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
        proposalDurationInHours: 169,
      });
    };
    const durationNotInteger = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
        proposalDurationInHours: 3.14159,
      });
    };
    expect(durationTooShort).toThrow(Error);
    expect(durationTooLong).toThrow(Error);
    expect(durationNotInteger).toThrow(Error);
  });

  test('Fail to create a network with an invalid voting policy threshold percentage', () => {
    const thresholdTooSmall = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
        thresholdPercentage: -1,
      });
    };
    const thresholdTooLarge = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
        thresholdPercentage: 101,
      });
    };
    const thresholdNotInteger = () => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
      new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
        networkName: 'TestNetwork',
        memberName: 'TestMember',
        thresholdPercentage: 1.61803,
      });
    };
    expect(thresholdTooSmall).toThrow(Error);
    expect(thresholdTooLarge).toThrow(Error);
    expect(thresholdNotInteger).toThrow(Error);
  });

  test('Create network with CA Logging disabled', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
    const network = new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
      networkName: 'TestNetwork',
      memberName: 'TestMember',
      enableCaLogging: false,
    });

    expect(network.enableCaLogging).toBe(false);
  });

  test('Create network with CA logging enabled', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', DEFAULT_ENV);
    const network = new hyperledger.HyperledgerFabricNetwork(stack, 'TestHyperledgerFabricNetwork', {
      networkName: 'TestNetwork',
      memberName: 'TestMember',
      enableCaLogging: true,
    });

    expect(network.enableCaLogging).toBe(true);
  });

});
