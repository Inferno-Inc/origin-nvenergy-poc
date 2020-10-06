import React from 'react';
import { mount } from 'enzyme';
import { ProducingDeviceTable } from '../../components/devices/ProducingDeviceTable';
import { dataTestSelector } from '../../utils';
import {
    setupStore,
    WrapperComponent,
    createRenderedHelpers,
    TEST_DEVICE_TYPES
} from '../utils/helpers';
import {
    DeviceStatus,
    IOffChainDataSource,
    IPublicOrganization
} from '@energyweb/origin-backend-core';
import { configurationUpdated } from '../../features';
import { Configuration, DeviceTypeService } from '@energyweb/utils-general';
import { OffChainDataSourceMock } from '@energyweb/origin-backend-client-mocks';
import { BigNumber } from 'ethers';

describe('ProducingDeviceTable', () => {
    it('correctly renders and search works', async () => {
        const offChainDataSource: IOffChainDataSource = new OffChainDataSourceMock();

        await offChainDataSource.configurationClient.update({
            deviceTypes: TEST_DEVICE_TYPES
        });

        const { store, history, addProducingDevice } = setupStore(undefined, {
            offChainDataSource,
            mockUserFetcher: false,
            logActions: false
        });

        const testOrganizationName = 'Test organization name';

        addProducingDevice({
            id: 0,
            status: DeviceStatus.Active,
            meterStats: {
                uncertified: BigNumber.from(7777),
                certified: BigNumber.from(0)
            },
            organization: {
                name: testOrganizationName
            } as IPublicOrganization
        });

        addProducingDevice({
            id: 1,
            status: DeviceStatus.Active,
            facilityName: 'Biomass Energy Facility',
            deviceType: 'Gaseous;Agricultural gas',
            address:
                '95 Moo 7, Sa Si Mum Sub-district, Kamphaeng Saen District, Nakhon Province 73140',
            country: 'Thailand',
            capacityInW: 736123,
            region: 'Central',
            province: 'Nakhon Pathom',
            organization: {
                name: testOrganizationName
            } as IPublicOrganization
        });

        store.dispatch(
            configurationUpdated(({
                deviceTypeService: new DeviceTypeService(TEST_DEVICE_TYPES)
            } as Partial<Configuration.Entity>) as Configuration.Entity)
        );

        const rendered = mount(
            <WrapperComponent store={store} history={history}>
                <ProducingDeviceTable
                    hiddenColumns={['status']}
                    actions={{
                        requestCertificates: true
                    }}
                />
            </WrapperComponent>
        );

        const { refresh, assertPagination, assertMainTableContent } = createRenderedHelpers(
            rendered
        );

        await refresh();

        assertMainTableContent([
            testOrganizationName,
            'Wuthering Heights facility',
            'Solar - Photovoltaic - Roof mounted',
            '9.877',
            '0',
            '0.777',
            'View details',
            // next device
            testOrganizationName,
            'Biomass Energy Facility',
            'Gaseous - Agricultural gas',
            '0.736',
            '0',
            '0',
            'View details'
        ]);

        assertPagination(1, 2, 2);

        const searchInput = rendered.find(
            `${dataTestSelector(`Search by facility name and organization-textfield`)} input`
        );

        searchInput.simulate('change', { target: { value: 'Biomass' } });

        await refresh();

        assertMainTableContent([
            testOrganizationName,
            'Biomass Energy Facility',
            'Gaseous - Agricultural gas',
            '0.736',
            '0',
            '0',
            'View details'
        ]);

        assertPagination(1, 1, 1);

        searchInput.simulate('change', { target: { value: 'Wuthering Heights' } });

        await refresh();

        assertMainTableContent([
            testOrganizationName,
            'Wuthering Heights facility',
            'Solar - Photovoltaic - Roof mounted',
            '9.877',
            '0',
            '0.777',
            'View details'
        ]);

        assertPagination(1, 1, 1);
    });
});
