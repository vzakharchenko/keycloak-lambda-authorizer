import React from 'react';
import { makeStyles } from '@material-ui/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import { AccountCircle } from '@material-ui/icons';
import { getDecodedTenantToken, getTenants } from 'keycloak-lambda-cloudfront-ui';

function useStyles() {
  return makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }));
}

export default
class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null, token1: null, token2: null,
    };
  }

  async componentDidMount() {
    try {
      if (getTenants('tenant1', 'tenant1Client')) {
        const t1 = await getDecodedTenantToken('tenant1', 'tenant1Client');
        this.setState({ token1: t1 });
      }
      if (getTenants('Tenant2', 'tenant2Client')) {
        const t2 = await getDecodedTenantToken('Tenant2', 'tenant2Client');
        this.setState({ token2: t2 });
      }
    } catch (e) {
      console.error(e);
    }
  }

    handleMenu = (event) => {
      this.setState({ anchorEl: event.currentTarget });
    };

    handleClose = () => {
      this.setState({ anchorEl: null });
    };

    handleSwitch =(tenant) => {
      window.location.replace(tenant);
    };

    handleLogout =(realm, resource) => {
      window.location.replace(`/${realm}/${resource}/logout`);
    };

    render() {
      // const [anchorEl, setAnchorEl] = React.useState(null);
      // const open = Boolean(anchorEl);
      const { anchorEl, token1, token2 } = this.state;
      const open = Boolean(anchorEl);
      const classes = useStyles();
      return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" className={classes.title}>
                            You are Logged In.
                        </Typography>
                            <div>
                                <IconButton
                                  aria-label="account of current user"
                                  aria-controls="menu-appbar"
                                  aria-haspopup="true"
                                  onClick={this.handleMenu}
                                  color="inherit"
                                >
                                    <AccountCircle />
                                </IconButton>
                                <Menu
                                  id="menu-appbar"

                                  anchorEl={anchorEl}
                                  open={open}
                                  onClose={this.handleClose}
                                  anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                  }}
                                  keepMounted
                                  transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                  }}
                                >
                                    <MenuItem onClick={() => this.handleSwitch('/tenant1.html')}>
Tenant 1
{token1 ? token1.email : ''}
                                    </MenuItem>
                                    <MenuItem onClick={() => this.handleSwitch('/tenant2.html')}>
Tenant 2
{token2 ? token2.email : ''}
                                    </MenuItem>
                                    <MenuItem onClick={() => this.handleLogout('tenant1', 'tenant1Client')}>Logout Tenant1</MenuItem>
                                    <MenuItem onClick={() => this.handleLogout('Tenant2', 'tenant2Client')}> Logout Tenant2</MenuItem>
                                </Menu>
                            </div>
                    </Toolbar>
                </AppBar>
            </div>
      );
    }
}
