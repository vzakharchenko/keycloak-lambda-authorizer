import React from 'react';
import Container from '@material-ui/core/Container';
import { Paper } from '@material-ui/core';
import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import { makeStyles } from '@material-ui/styles';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import {
  getTenantCookie,
  getTenantCookieValue,
  getTenant,
  getTenants,
} from 'keycloak-lambda-cloudfront-ui';

const fetch = require('axios');

const TENANT_APIS = {};

async function fetchData(url, method = 'GET', headers) {
  const ret = await fetch({
    url,
    method,
    headers,
    transformResponse: (req) => req,
    withCredentials: true,
  });
  return ret.data;
}


export default
class App extends React.Component {
  // eslint-disable-next-line class-methods-use-this


  async componentDidMount() {
    const tenants = getTenants();
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < tenants.length; i++) {
      const row = tenants[i];
      if (row.realm !== 'portal') {
        // eslint-disable-next-line no-await-in-loop
        const ret = await fetchData(`/tenants/${row.realm}/api`);
        const tenant = getTenant(row.realm, row.resource);
        TENANT_APIS[row.realm] = { data: ret, tenant: tenant.resourceSession };
      } else {
        TENANT_APIS[row.realm] = { data: ' - ' };
      }
    }
    this.forceUpdate();
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    const classes = makeStyles({
      table: {
        minWidth: 650,
      },
    });
    const tenants = getTenants().filter((tenant) => tenant.realm !== 'portal');
    return (
            <Container fixed>
                <TableContainer component={Paper}>
                    <Table className={classes.table} aria-label="Select Tenant">
                        <TableHead>
                            <TableRow>
                                <TableCell>Tenant Name</TableCell>
                                <TableCell align="right">Client Name</TableCell>
                                <TableCell align="right">Cookie Name</TableCell>
                                <TableCell align="right">Access Token</TableCell>
                                <TableCell align="right">Protected Api Response</TableCell>
                                <TableCell align="right">Last Used</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tenants.map((row) => (
                                <TableRow key={`${row.realm}-${row.resource}`}>
                                    <TableCell component="th" scope="row">
                                        {row.realm}
                                    </TableCell>
                                    <TableCell align="right">{row.resource}</TableCell>
                                    <TableCell align="right">{getTenantCookie(row.realm, row.resource)}</TableCell>
                                    <TableCell align="left">{getTenantCookieValue(getTenantCookie(row.realm, row.resource))}</TableCell>
                                    <TableCell align="right">{TENANT_APIS[row.realm] ? TENANT_APIS[row.realm].data : ' - '}</TableCell>
                                    <TableCell align="right">{TENANT_APIS[row.realm] ? TENANT_APIS[row.realm].tenant.status : 'Undefined'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
    );
  }
}
