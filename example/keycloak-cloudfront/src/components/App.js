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
  getTenants,
} from 'keycloak-lambda-cloudfront-ui';

export default
class App extends React.Component {
  render() {
    const classes = makeStyles({
      table: {
        minWidth: 650,
      },
    });
    const tenants = getTenants();
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
                                    <TableCell align="right">{getTenantCookieValue(getTenantCookie(row.realm, row.resource))}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
    );
  }
}
