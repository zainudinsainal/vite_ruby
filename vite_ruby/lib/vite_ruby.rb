# frozen_string_literal: true

require 'logger'
require 'forwardable'
require 'pathname'

require 'zeitwerk'
loader = Zeitwerk::Loader.for_gem
loader.ignore("#{ __dir__ }/install")
loader.ignore("#{ __dir__ }/tasks")
loader.ignore("#{ __dir__ }/exe")
loader.inflector.inflect('cli' => 'CLI')
loader.inflector.inflect('io' => 'IO')
loader.setup

require 'vite_ruby/version'

class ViteRuby
  # Internal: Prefix used for environment variables that modify the configuration.
  ENV_PREFIX = 'VITE_RUBY'

  # Internal: Companion libraries for Vite Ruby, and their target framework.
  COMPANION_LIBRARIES = {
    'vite_rails' => 'rails',
    'vite_hanami' => 'hanami',
    'vite_padrino' => 'padrino',
    'jekyll-vite' => 'jekyll',
    'vite_rails_legacy' => 'rails',
  }

  class << self
    extend Forwardable

    def_delegators :instance, :config, :commands, :env, :run, :run_proxy?
    def_delegators :config, :mode

    def instance
      @instance ||= new
    end

    # Internal: Refreshes the manifest.
    def bootstrap
      instance.manifest.refresh
    end

    # Internal: Loads all available rake tasks.
    def install_tasks
      load File.expand_path('tasks/vite.rake', __dir__)
    end

    # Internal: Creates a new instance with the specified options.
    def reload_with(**config_options)
      @instance = new(**config_options)
    end

    # Internal: Detects if the application has installed a framework-specific
    # variant of Vite Ruby.
    def framework_libraries
      COMPANION_LIBRARIES.map { |name, framework|
        if library = Gem.loaded_specs[name]
          [framework, library]
        end
      }.compact
    end
  end

  attr_writer :logger

  def initialize(**config_options)
    @config_options = config_options
  end

  def logger
    @logger ||= Logger.new($stdout)
  end

  # Public: Returns true if the Vite development server is currently running.
  # NOTE: Checks only once every second since every lookup calls this method.
  def dev_server_running?
    return false unless run_proxy?
    return true if defined?(@running_at) && @running_at && Time.now - @running_at < 1

    Socket.tcp(config.host, config.port, connect_timeout: config.dev_server_connect_timeout).close
    @running_at = Time.now
    true
  rescue StandardError
    @running_at = false
  end

  # Public: Additional environment variables to pass to Vite.
  #
  # Example:
  #   ViteRuby.env['VITE_RUBY_CONFIG_PATH'] = 'config/alternate_vite.json'
  def env
    @env ||= ENV.select { |key, _| key.start_with?(ENV_PREFIX) }
  end

  # Public: The proxy for assets should only run in development mode.
  def run_proxy?
    config.mode == 'development'
  rescue StandardError => error
    logger.error("Failed to check mode for Vite: #{ error.message }")
    false
  end

  # Internal: Executes the vite binary.
  def run(argv, **options)
    (@runner ||= ViteRuby::Runner.new(self)).run(argv, **options)
  end

  # Public: Keeps track of watched files and triggers builds as needed.
  def builder
    @builder ||= ViteRuby::Builder.new(self)
  end

  # Internal: Helper to run commands related with Vite.
  def commands
    @commands ||= ViteRuby::Commands.new(self)
  end

  # Public: Current instance configuration for Vite.
  def config
    @config ||= ViteRuby::Config.resolve_config(**@config_options)
  end

  # Public: Enables looking up assets managed by Vite using name and type.
  def manifest
    @manifest ||= ViteRuby::Manifest.new(self)
  end
end
