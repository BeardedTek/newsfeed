import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Menu, MenuItem, useMediaQuery, useTheme, Select, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Source {
  id: string;
  title: string;
  url: string;
  icon: string;
}

const Navbar = () => {
  const { data: session } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/sources');
        if (response.ok) {
          const data = await response.json();
          setSources(data.sources);
        }
      } catch (error) {
        console.error('Error fetching sources:', error);
      }
    };

    fetchSources();
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleClose();
    signOut();
  };

  const handleSourceChange = (event: SelectChangeEvent<string>) => {
    const sourceId = event.target.value;
    setSelectedSource(sourceId);
    if (sourceId) {
      router.push(`/sources/${sourceId}`);
    } else {
      router.push('/');
    }
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={1}
      sx={{
        borderBottom: '1px solid #eee',
        ...(isMobile && {
          minHeight: 48,
        }),
      }}
    >
      <Toolbar
        sx={{
          px: isMobile ? 1 : 2,
          minHeight: isMobile ? 48 : 64,
          height: isMobile ? 48 : 64,
        }}
      >
        <Typography
          variant={isMobile ? 'subtitle1' : 'h6'}
          component="div"
          sx={{ flexGrow: 1, fontWeight: 700, fontSize: isMobile ? '1.1rem' : '1.25rem', letterSpacing: 0.5 }}
        >
          NewsFeed
        </Typography>

        {!isMobile && (
          <FormControl sx={{ minWidth: 200, mx: 2 }}>
            <InputLabel id="source-select-label">Source</InputLabel>
            <Select
              labelId="source-select-label"
              id="source-select"
              value={selectedSource}
              label="Source"
              onChange={handleSourceChange}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="">
                <em>All Sources</em>
              </MenuItem>
              {sources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
              sx={{ ml: 1 }}
            >
              <MenuIcon sx={{ fontSize: 32 }} />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  minWidth: 180,
                  p: 0.5,
                },
              }}
            >
              <MenuItem disabled sx={{ fontSize: '1rem', py: 1 }}>
                Sources
              </MenuItem>
              <MenuItem
                value=""
                onClick={() => {
                  handleClose();
                  setSelectedSource('');
                  router.push('/');
                }}
                sx={{ fontSize: '1rem', py: 1.5 }}
              >
                All Sources
              </MenuItem>
              {sources.map((source) => (
                <MenuItem
                  key={source.id}
                  value={source.id}
                  onClick={() => {
                    handleClose();
                    setSelectedSource(source.id);
                    router.push(`/sources/${source.id}`);
                  }}
                  sx={{ fontSize: '1rem', py: 1.5 }}
                >
                  {source.title}
                </MenuItem>
              ))}
              <MenuItem disabled sx={{ fontSize: '1rem', py: 1, mt: 1 }}>
                Account
              </MenuItem>
              {session ? (
                <MenuItem onClick={handleSignOut} sx={{ fontSize: '1rem', py: 1.5 }}>
                  Sign Out
                </MenuItem>
              ) : (
                <MenuItem onClick={handleClose} component="a" href="/api/auth/signin" sx={{ fontSize: '1rem', py: 1.5 }}>
                  Sign In
                </MenuItem>
              )}
            </Menu>
          </>
        ) : (
          <Box>
            {session ? (
              <Button color="inherit" onClick={() => signOut()}>
                Sign Out
              </Button>
            ) : (
              <Button color="inherit" href="/api/auth/signin">
                Sign In
              </Button>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 